//! THE Note execution adapter. User code runs only in explicit, separate processes.
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    io::Read,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, AtomicUsize, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant},
};
use tauri::{Emitter, Manager};

#[derive(Default)]
pub struct RunRegistry(Mutex<HashMap<String, Arc<AtomicBool>>>);
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunRequest {
    id: String,
    language: String,
    code: String,
    cwd: Option<String>,
    base_dir: Option<String>,
    env: HashMap<String, String>,
}
#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RunEvent {
    id: String,
    kind: String,
    text: String,
    exit_code: Option<i32>,
    duration_ms: u128,
}
type Sink = Arc<dyn Fn(RunEvent) + Send + Sync>;
const OUTPUT_LIMIT: usize = 1024 * 1024;

fn interpreter(lang: &str) -> Result<(&'static str, Vec<&'static str>), String> {
    match lang {
        "sh" | "bash" | "shell" => Ok(("/bin/bash", vec!["-c"])),
        "zsh" => Ok(("/bin/zsh", vec!["-c"])),
        "python" | "python3" | "py" => Ok(("python3", vec!["-u", "-c"])),
        "javascript" | "js" | "node" => Ok(("node", vec!["-e"])),
        _ => Err(format!("Unsupported runtime: {lang}")),
    }
}
fn resolve_cwd(req: &RunRequest) -> Result<PathBuf, String> {
    let home = std::env::var("HOME")
        .map(PathBuf::from)
        .map_err(|_| "Home directory unavailable")?;
    let base = req
        .base_dir
        .as_ref()
        .map(PathBuf::from)
        .unwrap_or(home.clone());
    let path = match req.cwd.as_deref() {
        None | Some("") => base,
        Some("~") => home,
        Some(p) if p.starts_with("~/") => home.join(&p[2..]),
        Some(p) if Path::new(p).is_absolute() => PathBuf::from(p),
        Some(p) => base.join(p),
    };
    if !path.is_dir() {
        return Err(format!(
            "Working directory does not exist: {}",
            path.display()
        ));
    }
    path.canonicalize().map_err(|e| e.to_string())
}
fn prepare(req: &RunRequest) -> Result<Command, String> {
    if req.code.len() > 256 * 1024 {
        return Err("Code block exceeds 256 KB".into());
    }
    if req.id.is_empty() || req.id.len() > 100 {
        return Err("Invalid run ID".into());
    }
    let (program, args) = interpreter(&req.language)?;
    let mut command = Command::new(program);
    command
        .args(args)
        .arg(&req.code)
        .current_dir(resolve_cwd(req)?);
    for (key, value) in &req.env {
        if key.is_empty()
            || key.as_bytes()[0].is_ascii_digit()
            || !key.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'_')
            || value.contains('\0')
        {
            return Err(format!("Invalid environment variable: {key}"));
        }
        command.env(key, value);
    }
    // Finder-launched apps have a minimal PATH; include common interpreter locations.
    let path = std::env::var("PATH").unwrap_or_default();
    if !req.env.contains_key("PATH") {
        command.env(
            "PATH",
            format!("{path}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"),
        );
    }
    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }
    Ok(command)
}
fn terminate(child: &mut std::process::Child) {
    #[cfg(unix)]
    unsafe {
        libc::kill(-(child.id() as i32), libc::SIGKILL);
    }
    let _ = child.kill();
}
fn drain(mut reader: impl Read, id: String, kind: &str, sink: Sink, bytes: Arc<AtomicUsize>) {
    let mut buf = [0u8; 4096];
    let mut pending = Vec::new();
    loop {
        let n = match reader.read(&mut buf) {
            Ok(0) | Err(_) => break,
            Ok(n) => n,
        };
        let previous = bytes.fetch_add(n, Ordering::Relaxed);
        if previous >= OUTPUT_LIMIT {
            continue;
        }
        pending.extend_from_slice(&buf[..n.min(OUTPUT_LIMIT - previous)]);
        let valid = match std::str::from_utf8(&pending) {
            Ok(_) => pending.len(),
            Err(e) if e.error_len().is_none() => e.valid_up_to(),
            Err(_) => pending.len(),
        };
        if valid > 0 {
            sink(RunEvent {
                id: id.clone(),
                kind: kind.into(),
                text: String::from_utf8_lossy(&pending[..valid]).into(),
                exit_code: None,
                duration_ms: 0,
            });
            pending.drain(..valid);
        }
        if previous + n >= OUTPUT_LIMIT {
            sink(RunEvent {
                id: id.clone(),
                kind: "stderr".into(),
                text: "\n[Output limited to 1 MB]\n".into(),
                exit_code: None,
                duration_ms: 0,
            });
        }
    }
    if !pending.is_empty() {
        sink(RunEvent {
            id,
            kind: kind.into(),
            text: String::from_utf8_lossy(&pending).into(),
            exit_code: None,
            duration_ms: 0,
        });
    }
}
fn run(
    req: RunRequest,
    cancel: Arc<AtomicBool>,
    sink: Sink,
    timeout: Duration,
) -> Result<(), String> {
    let mut child = prepare(&req)?
        .spawn()
        .map_err(|e| format!("Could not start {}: {e}", req.language))?;
    let start = Instant::now();
    let bytes = Arc::new(AtomicUsize::new(0));
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let a = {
        let id = req.id.clone();
        let sink = sink.clone();
        let bytes = bytes.clone();
        std::thread::spawn(move || drain(stdout, id, "stdout", sink, bytes))
    };
    let b = {
        let id = req.id.clone();
        let sink = sink.clone();
        let bytes = bytes.clone();
        std::thread::spawn(move || drain(stderr, id, "stderr", sink, bytes))
    };
    let mut reason = "finished";
    let status = loop {
        if cancel.load(Ordering::SeqCst) {
            reason = "cancelled";
            terminate(&mut child);
            break child.wait();
        }
        if start.elapsed() >= timeout {
            reason = "timeout";
            terminate(&mut child);
            break child.wait();
        }
        match child.try_wait() {
            Ok(Some(status)) => break Ok(status),
            Ok(None) => std::thread::sleep(Duration::from_millis(20)),
            Err(e) => {
                terminate(&mut child);
                let _ = child.wait();
                break Err(e);
            }
        }
    };
    // Also reap background descendants: they must not hold the output pipes open.
    #[cfg(unix)]
    unsafe {
        libc::kill(-(child.id() as i32), libc::SIGKILL);
    }
    let _ = a.join();
    let _ = b.join();
    let status = status.map_err(|e| e.to_string())?;
    sink(RunEvent {
        id: req.id,
        kind: reason.into(),
        text: String::new(),
        exit_code: status.code(),
        duration_ms: start.elapsed().as_millis(),
    });
    Ok(())
}
#[tauri::command]
pub fn start_block(window: tauri::WebviewWindow, request: RunRequest) -> Result<(), String> {
    prepare(&request)?;
    let key = format!("{}:{}", window.label(), request.id);
    let state = window.state::<RunRegistry>();
    let cancel = Arc::new(AtomicBool::new(false));
    {
        let mut runs = state.0.lock().map_err(|e| e.to_string())?;
        if runs.contains_key(&key) {
            return Err("Run already active".into());
        }
        if runs.len() >= 8 {
            return Err("Eight processes already running".into());
        }
        runs.insert(key.clone(), cancel.clone());
    }
    let app = window.app_handle().clone();
    std::thread::spawn(move || {
        let target = window.clone();
        let sink: Sink = Arc::new(move |event| {
            let _ = target.emit("note-run", event);
        });
        let id = request.id.clone();
        if let Err(error) = run(request, cancel, sink.clone(), Duration::from_secs(120)) {
            sink(RunEvent {
                id,
                kind: "error".into(),
                text: error,
                exit_code: None,
                duration_ms: 0,
            });
        }
        if let Ok(mut runs) = app.state::<RunRegistry>().0.lock() {
            runs.remove(&key);
        }
    });
    Ok(())
}
#[tauri::command]
pub fn stop_block(window: tauri::WebviewWindow, id: String) -> Result<(), String> {
    let state = window.state::<RunRegistry>();
    let runs = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(cancel) = runs.get(&format!("{}:{id}", window.label())) {
        cancel.store(true, Ordering::SeqCst);
    }
    Ok(())
}
pub fn cancel_window(app: &tauri::AppHandle, label: &str) {
    if let Ok(runs) = app.state::<RunRegistry>().0.lock() {
        for (key, cancel) in runs.iter() {
            if key.starts_with(&format!("{label}:")) {
                cancel.store(true, Ordering::SeqCst);
            }
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn request(code: &str) -> RunRequest {
        RunRequest {
            id: "test".into(),
            language: "sh".into(),
            code: code.into(),
            cwd: None,
            base_dir: Some(std::env::temp_dir().to_string_lossy().into()),
            env: HashMap::from([("NOTE_TEST".into(), "spaces ' and $ safe".into())]),
        }
    }
    fn collect(req: RunRequest, cancel: bool, timeout: Duration) -> Vec<RunEvent> {
        let events = Arc::new(Mutex::new(Vec::new()));
        let out = events.clone();
        run(
            req,
            Arc::new(AtomicBool::new(cancel)),
            Arc::new(move |e| out.lock().unwrap().push(e)),
            timeout,
        )
        .unwrap();
        let result = events.lock().unwrap().clone();
        result
    }
    #[test]
    fn streams_and_reports_exit() {
        let e = collect(
            request("printf '%s' \"$NOTE_TEST\"; printf 'bad' >&2; exit 7"),
            false,
            Duration::from_secs(2),
        );
        assert!(e
            .iter()
            .any(|e| e.kind == "stdout" && e.text.contains("spaces ' and $ safe")));
        assert!(e.iter().any(|e| e.kind == "stderr" && e.text == "bad"));
        assert_eq!(e.last().unwrap().exit_code, Some(7));
    }
    #[test]
    fn cancellation_kills_descendants() {
        let e = collect(request("sleep 30 & wait"), true, Duration::from_secs(2));
        assert_eq!(e.last().unwrap().kind, "cancelled");
    }
    #[test]
    fn timeout_kills_descendants() {
        let e = collect(request("sleep 30 & wait"), false, Duration::from_millis(80));
        assert_eq!(e.last().unwrap().kind, "timeout");
    }
    #[test]
    fn rejects_unknown_language_and_missing_cwd() {
        let mut r = request("ignored");
        r.language = "mermaid".into();
        assert!(prepare(&r).is_err());
        r.language = "sh".into();
        r.cwd = Some("/definitely/not/a/real/directory".into());
        assert!(prepare(&r).is_err());
    }
    #[test]
    fn output_is_bounded() {
        let e = collect(
            request("yes output | head -c 1100000"),
            false,
            Duration::from_secs(3),
        );
        let len: usize = e.iter().map(|e| e.text.len()).sum();
        assert!(len <= OUTPUT_LIMIT + 100);
        assert!(e.iter().any(|e| e.text.contains("Output limited")));
    }
}
