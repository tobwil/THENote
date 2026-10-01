use super::*;
#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub id: String,
    pub name: String,
    pub output_limit: Option<u64>,
}

pub fn authenticated(
    config: &AiConfig,
    builder: reqwest::RequestBuilder,
    key: Option<&str>,
) -> reqwest::RequestBuilder {
    let builder = if config.protocol == "anthropic" {
        builder.header("anthropic-version", "2023-06-01")
    } else {
        builder
    };
    match (config.protocol.as_str(), key) {
        ("anthropic", Some(key)) => builder.header("x-api-key", key),
        ("gemini", Some(key)) => builder.header("x-goog-api-key", key),
        (_, Some(key)) => builder.bearer_auth(key),
        _ => builder,
    }
}
pub fn post_url(config: &AiConfig) -> Result<reqwest::Url, String> {
    let mut url = reqwest::Url::parse(&config.endpoint).map_err(|_| "Ungültiger Endpoint.")?;
    if config.protocol == "gemini" {
        let model = config
            .model
            .strip_prefix("models/")
            .unwrap_or(&config.model);
        if model.is_empty()
            || !model
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"-_.".contains(&b))
        {
            return Err("Ungültige Gemini-Modell-ID.".into());
        }
        url.set_path(&format!(
            "{}/{}:streamGenerateContent",
            url.path().trim_end_matches('/'),
            model
        ));
        url.set_query(Some("alt=sse"));
    }
    Ok(url)
}
pub fn body(config: &AiConfig, messages: &[ChatMessage]) -> Value {
    if config.protocol == "anthropic" {
        json!({"model":config.model,"system":SYSTEM,"messages":messages,"max_tokens":config.max_tokens,"stream":true})
    } else {
        let contents: Vec<Value> = messages.iter().map(|m| json!({"role":if m.role=="assistant" {"model"} else {"user"}, "parts":[{"text":m.content}]})).collect();
        json!({"systemInstruction":{"parts":[{"text":SYSTEM}]},"contents":contents,"generationConfig":{"maxOutputTokens":config.max_tokens}})
    }
}
pub fn event(
    value: &Value,
    protocol: &str,
) -> Result<(Option<String>, Option<&'static str>), String> {
    if protocol == "anthropic" {
        if value["type"] == "content_block_delta" && value["delta"]["type"] == "text_delta" {
            return Ok((value["delta"]["text"].as_str().map(String::from), None));
        }
        if value["type"] == "message_delta" {
            return match value["delta"]["stop_reason"].as_str() {
                Some("end_turn" | "stop_sequence" | "refusal") => Ok((None, Some("done"))),
                Some("max_tokens" | "model_context_window_exceeded") => {
                    Ok((None, Some("incomplete")))
                }
                Some(_) => Err("Claude hat keine abgeschlossene Textantwort geliefert.".into()),
                None => Ok((None, None)),
            };
        }
        Ok((None, None))
    } else {
        if value["promptFeedback"]["blockReason"].is_string() {
            return Err("Gemini hat diese Anfrage blockiert.".into());
        }
        let candidate = &value["candidates"][0];
        let text = candidate["content"]["parts"]
            .as_array()
            .map(|parts| {
                parts
                    .iter()
                    .filter(|p| p["thought"] != true)
                    .filter_map(|p| p["text"].as_str())
                    .collect::<String>()
            })
            .filter(|s| !s.is_empty());
        let terminal = match candidate["finishReason"].as_str() {
            Some("STOP") => Some("done"),
            Some("FINISH_REASON_UNSPECIFIED") | None => None,
            Some(_) => Some("incomplete"),
        };
        Ok((text, terminal))
    }
}
fn models_url(config: &AiConfig) -> Result<reqwest::Url, String> {
    let mut url = reqwest::Url::parse(&config.endpoint).map_err(|_| "Endpoint fehlt.")?;
    if config.protocol == "gemini" {
        return Ok(url);
    }
    let path = url.path().trim_end_matches('/');
    let prefix=["chat/completions","responses","messages"].iter().find_map(|suffix|path.strip_suffix(suffix)).ok_or("Für diesen Endpoint ist kein Modellverzeichnis ableitbar. Modell-ID bitte manuell eingeben.")?;
    url.set_path(&format!("{prefix}models"));
    Ok(url)
}
fn parse_models(value: &Value, config: &AiConfig) -> Result<Vec<Model>, String> {
    let field = if config.protocol == "gemini" {
        "models"
    } else {
        "data"
    };
    let entries = value[field]
        .as_array()
        .ok_or("Der Dienst liefert keine unterstützte Modellliste. Modell-ID manuell eingeben.")?;
    let mut ordered: Vec<_> = entries.iter().collect();
    if config.protocol == "responses" {
        ordered.sort_by_key(|m| std::cmp::Reverse(m["created"].as_u64().unwrap_or(0)));
    }
    let public_openai = reqwest::Url::parse(&config.endpoint)
        .ok()
        .is_some_and(|u| u.host_str() == Some("api.openai.com"));
    Ok(ordered
        .into_iter()
        .filter_map(|m| {
            let id = m["id"]
                .as_str()
                .or(m["name"].as_str())?
                .strip_prefix("models/")
                .unwrap_or_else(|| m["id"].as_str().or(m["name"].as_str()).unwrap());
            if id.len() > 200 {
                return None;
            }
            if config.protocol == "gemini"
                && !m["supportedGenerationMethods"]
                    .as_array()
                    .is_some_and(|a| a.iter().any(|v| v == "generateContent"))
            {
                return None;
            }
            if public_openai
                && (!(id.starts_with("gpt-")
                    || id.starts_with("chatgpt-")
                    || (id.starts_with('o')
                        && id.as_bytes().get(1).is_some_and(u8::is_ascii_digit)))
                    || [
                        "audio",
                        "realtime",
                        "transcri",
                        "tts",
                        "image",
                        "search",
                        "instruct",
                        "deep-research",
                    ]
                    .iter()
                    .any(|x| id.contains(x)))
            {
                return None;
            }
            if config.protocol == "gemini"
                && ["image", "tts", "audio", "robotics"]
                    .iter()
                    .any(|x| id.contains(x))
            {
                return None;
            }
            Some(Model {
                id: id.into(),
                name: m["display_name"]
                    .as_str()
                    .or(m["displayName"].as_str())
                    .unwrap_or(id)
                    .into(),
                output_limit: m["outputTokenLimit"].as_u64().or(m["max_tokens"].as_u64()),
            })
        })
        .collect())
}
pub async fn list_models(config: &AiConfig, key: Option<&str>) -> Result<Vec<Model>, String> {
    let base = models_url(config)?;
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|_| "HTTP-Client nicht verfügbar.")?;
    let mut out = vec![];
    let mut next: Option<String> = None;
    for _ in 0..10 {
        let mut url = base.clone();
        if config.protocol == "anthropic" {
            url.query_pairs_mut().append_pair("limit", "1000");
            if let Some(cursor) = &next {
                url.query_pairs_mut().append_pair("after_id", cursor);
            }
        }
        if config.protocol == "gemini" {
            url.query_pairs_mut().append_pair("pageSize", "1000");
            if let Some(cursor) = &next {
                url.query_pairs_mut().append_pair("pageToken", cursor);
            }
        }
        let response = authenticated(config, client.get(url), key)
            .send()
            .await
            .map_err(|_| "Modellliste nicht erreichbar. Endpoint, Netzwerk und Key prüfen.")?;
        if !response.status().is_success() {
            return Err(format!(
                "Modellliste: HTTP {}. Key/Berechtigung prüfen oder Modell-ID manuell eingeben.",
                response.status().as_u16()
            ));
        }
        let mut bytes = vec![];
        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            bytes.extend_from_slice(&chunk.map_err(|_| "Modellliste unterbrochen.")?);
            if bytes.len() > 2 * 1024 * 1024 {
                return Err("Modellliste zu groß.".into());
            }
        }
        let value: Value =
            serde_json::from_slice(&bytes).map_err(|_| "Modellliste ist kein gültiges JSON.")?;
        for model in parse_models(&value, config)? {
            if !out.iter().any(|m: &Model| m.id == model.id) {
                out.push(model);
            }
        }
        let cursor = if config.protocol == "gemini" {
            value["nextPageToken"].as_str()
        } else if value["has_more"] == true {
            value["last_id"].as_str()
        } else {
            None
        };
        match cursor.filter(|s| !s.is_empty()) {
            Some(cursor) if next.as_deref() != Some(cursor) => next = Some(cursor.into()),
            Some(_) => return Err("Ungültige Seitennavigation der Modellliste.".into()),
            None => {
                return if out.is_empty() {
                    Err("Keine passenden Textmodelle gefunden. Modell-ID gegebenenfalls manuell eingeben.".into())
                } else {
                    Ok(out)
                }
            }
        }
    }
    Err("Zu viele Modellseiten. Modell-ID bitte manuell eingeben.".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn config(protocol: &str) -> AiConfig {
        AiConfig {
            enabled: true,
            endpoint: if protocol == "gemini" {
                "https://generativelanguage.googleapis.com/v1beta/models"
            } else {
                "https://api.openai.com/v1/responses"
            }
            .into(),
            protocol: protocol.into(),
            model: "model".into(),
            ..AiConfig::default()
        }
    }
    #[test]
    fn provider_payloads_and_terminal_reasons() {
        let messages = vec![
            ChatMessage {
                role: "assistant".into(),
                content: "previous".into(),
            },
            ChatMessage {
                role: "user".into(),
                content: "next".into(),
            },
        ];
        let value = body(&config("gemini"), &messages);
        assert_eq!(value["contents"][0]["role"], "model");
        assert!(value.get("tools").is_none());
        assert_eq!(
            event(
                &json!({"type":"message_delta","delta":{"stop_reason":"max_tokens"}}),
                "anthropic"
            )
            .unwrap()
            .1,
            Some("incomplete")
        );
        assert!(event(
            &json!({"type":"message_delta","delta":{"stop_reason":"tool_use"}}),
            "anthropic"
        )
        .is_err());
        assert_eq!(
            event(
                &json!({"candidates":[{"finishReason":"MAX_TOKENS"}]}),
                "gemini"
            )
            .unwrap()
            .1,
            Some("incomplete")
        );
        assert!(event(
            &json!({"promptFeedback":{"blockReason":"SAFETY"}}),
            "gemini"
        )
        .is_err());
        let mut c = config("gemini");
        c.model = "../escape?key=secret".into();
        assert!(post_url(&c).is_err());
    }
    #[test]
    fn text_model_filter_uses_service_ids_and_metadata() {
        let values = json!({"data":[{"id":"gpt-test","created":1},{"id":"gpt-new","created":2},{"id":"text-embedding-test"},{"id":"gpt-audio"}]});
        let models = parse_models(&values, &config("responses")).unwrap();
        assert_eq!(
            models.iter().map(|m| m.id.as_str()).collect::<Vec<_>>(),
            vec!["gpt-new", "gpt-test"]
        );
        let c = AiConfig {
            endpoint: "https://internal.example/v1/chat/completions".into(),
            ..config("chat-completions")
        };
        assert_eq!(
            parse_models(&json!({"data":[{"id":"our-model"}]}), &c).unwrap()[0].id,
            "our-model"
        );
        let values = json!({"models":[{"name":"models/gemini-test","displayName":"Gemini Test","supportedGenerationMethods":["generateContent"],"outputTokenLimit":1024},{"name":"models/embedding","supportedGenerationMethods":["embedContent"]}]});
        let models = parse_models(&values, &config("gemini")).unwrap();
        assert_eq!(models.len(), 1);
        assert_eq!(models[0].id, "gemini-test");
        assert_eq!(models[0].output_limit, Some(1024));
    }
    #[tokio::test(flavor = "current_thread")]
    async fn model_discovery_over_http_for_all_providers() {
        for protocol in ["responses", "chat-completions", "anthropic", "gemini"] {
            let response = if protocol == "gemini" {
                r#"{"models":[{"name":"models/gemini-test","displayName":"Gemini Test","supportedGenerationMethods":["generateContent"]}]}"#
            } else {
                r#"{"data":[{"id":"service-model","display_name":"Service Model"}],"has_more":false}"#
            };
            let (endpoint, rx, handle) =
                crate::ai::tests::server("200 OK", "application/json", response);
            let mut c = config(protocol);
            c.endpoint = if protocol == "gemini" {
                endpoint.replace("/v1/chat/completions", "/v1beta/models")
            } else {
                endpoint
            };
            let models = list_models(&c, Some("discovery-test-key")).await.unwrap();
            assert_eq!(models.len(), 1);
            let http = rx.recv_timeout(Duration::from_secs(5)).unwrap();
            assert!(http.starts_with(if protocol == "gemini" {
                "GET /v1beta/models?"
            } else if protocol == "anthropic" {
                "GET /v1/models?"
            } else {
                "GET /v1/models "
            }));
            assert!(!http.lines().next().unwrap().contains("discovery-test-key"));
            handle.join().unwrap();
        }
    }
}

#[cfg(test)]
mod pagination_tests {
    use super::*;
    use std::io::{Read, Write};
    #[tokio::test(flavor = "current_thread")]
    async fn gemini_model_pagination_preserves_origin_and_header_auth() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let endpoint = format!("http://{}/v1beta/models", listener.local_addr().unwrap());
        let worker = std::thread::spawn(move || {
            for page in 0..2 {
                let (mut socket, _) = listener.accept().unwrap();
                socket
                    .set_read_timeout(Some(Duration::from_secs(5)))
                    .unwrap();
                let mut input = vec![];
                loop {
                    let mut b = [0; 1024];
                    let n = socket.read(&mut b).unwrap();
                    assert!(n > 0);
                    input.extend_from_slice(&b[..n]);
                    if input.windows(4).any(|w| w == b"\r\n\r\n") {
                        break;
                    }
                }
                let request = String::from_utf8(input).unwrap();
                assert!(request.to_lowercase().contains("x-goog-api-key: test-key"));
                if page == 1 {
                    assert!(request.contains("pageToken=second-page"));
                }
                let mut value = json!({"models":[{"name":format!("models/gemini-page-{page}"),"supportedGenerationMethods":["generateContent"]}]});
                if page == 0 {
                    value["nextPageToken"] = json!("second-page");
                }
                let body = value.to_string();
                write!(socket,"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",body.len(),body).unwrap();
            }
        });
        let c = AiConfig {
            enabled: false,
            endpoint,
            protocol: "gemini".into(),
            ..AiConfig::default()
        };
        let models = list_models(&c, Some("test-key")).await.unwrap();
        assert_eq!(models.len(), 2);
        assert_eq!(models[1].id, "gemini-page-1");
        worker.join().unwrap();
    }
}
