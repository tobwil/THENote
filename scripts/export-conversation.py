#!/usr/bin/env python3
"""Export only visible user/assistant messages from a supplied JSONL session.

Never copies system/developer instructions, reasoning or raw tool payloads.
The operator must review the output and attachments before publishing it.
"""
import argparse
import datetime as dt
import html
import json
import re
from pathlib import Path
from zoneinfo import ZoneInfo

parser = argparse.ArgumentParser()
parser.add_argument('session', type=Path)
parser.add_argument('--workspace', type=Path, required=True)
parser.add_argument('--output', type=Path, default=Path('docs/history'))
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
attachments = {
    'codex-clipboard-1ddba514-0ea0-4f34-95da-11afaf240dfb.png': 'attachments/01-editor-spacing.png',
    'codex-clipboard-f3661421-8044-4aed-9c12-38597a795ad8.png': 'attachments/02-ai-mermaid-preview.png',
}

def sanitize(text):
    text = text.replace(str(args.workspace), '<WORKSPACE>')
    text = re.sub(r'/Users/[^/\s<>]+', '<HOME>', text)
    text = re.sub(r'/(?:private/)?var/folders/[^\s<>"\)]+', '<TEMP_PATH>', text)
    # Defense in depth: obvious credential formats must never survive export.
    text = re.sub(r'\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b', '[REDACTED_SECRET]', text)
    return text

messages = []
for line in args.session.read_text().splitlines():
    event = json.loads(line)
    payload = event.get('payload', {})
    if event.get('type') != 'response_item' or payload.get('type') != 'message':
        continue
    role = payload.get('role')
    if role not in ('user', 'assistant'):
        continue
    if role == 'assistant' and payload.get('phase') not in ('commentary', 'final_answer'):
        continue
    pieces, images = [], []
    for item in payload.get('content', []):
        if item.get('type') not in ('input_text', 'output_text'):
            continue
        text = item.get('text', '')
        if text.lstrip().startswith(('<recommended_plugins>', '<environment_context>')):
            continue
        if text.lstrip().startswith('<send_user_message_question_reply>'):
            match = re.search(r'<send_user_message_question_reply>\s*(.*?)\s*</send_user_message_question_reply>', text, re.S)
            if match:
                text = '\n\n'.join(f"Frage: {x['question']}\n\nAntwort: {x['answer']}" for x in json.loads(match.group(1)))
        for name, target in attachments.items():
            if name in text and target not in images:
                images.append(target)
        if text.startswith('<image ') or text == '</image>':
            continue
        if '## My request:' in text:
            text = text.split('## My request:', 1)[1].lstrip()
        if text.strip():
            pieces.append(sanitize(html.unescape(text)).strip())
    if not pieces:
        continue
    messages.append({'timestamp': event.get('timestamp'), 'role': role,
        'phase': payload.get('phase', 'message'), 'text': '\n\n'.join(pieces), 'attachments': images})

exported = dt.datetime.now(dt.timezone.utc).isoformat()
data = {'scope': 'Visible user and assistant messages only; local paths normalized; attachment wrappers removed. No system/developer instructions, reasoning, raw tools or automatic environment metadata.',
        'exported_at': exported, 'messages': messages}
(args.output / 'conversation.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
parts = ['# Gesprächsverlauf · THE Note', '', f'Exportiert: {exported}. Zeiten unten: Europe/Berlin.', '',
    'Vollständiger sichtbarer Nutzer-/Assistenten-Dialog bis zum Exportzeitpunkt, einschließlich Zwischenständen. Lokale Benutzerpfade wurden neutralisiert; automatisch eingefügte Umgebungsdaten sowie interne System-, Werkzeug- und Denkprotokolle sind nicht enthalten. Die beiden Nutzer-Anhänge liegen unverändert unter `attachments/`. Historische Aussagen beschreiben ihren damaligen Stand; der aktuelle Funktionsumfang steht in README und Changelog.', '']
for index, m in enumerate(messages, 1):
    stamp = dt.datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00')).astimezone(ZoneInfo('Europe/Berlin')).strftime('%Y-%m-%d %H:%M:%S %Z')
    who = 'Nutzer' if m['role'] == 'user' else 'Assistent'
    phase = 'Zwischenstand' if m['phase'] == 'commentary' else 'Antwort' if m['role'] == 'assistant' else 'Nachricht'
    parts += [f'## {index:03d} · {who} · {stamp} · {phase}', '', m['text'], '']
    parts += [f'![Nutzer-Anhang]({target})\n' for target in m['attachments']]
(args.output / 'CONVERSATION.md').write_text('\n'.join(parts) + '\n')
(args.output / 'README.md').write_text(f'''# Entwicklungsarchiv

- [Gesprächsverlauf](CONVERSATION.md): {len(messages)} sichtbare Nachrichten mit Zeitstempeln und den beiden ursprünglichen Nutzer-Anhängen.
- [Strukturierter Export](conversation.json): dieselben Nachrichten als JSON.
- [Changelog](../../CHANGELOG.md): aus den tatsächlichen Entwicklungsständen rekonstruierte Versionsgeschichte.
- [Architektur](../REENGINEERING.md) und [Validierung](../VALIDATION.md).

Das Archiv beginnt mit dem Auftrag, Sarala und Ledge zusammenzuführen, und endet beim Exportzeitpunkt {exported}. Der erste GitHub-Push veröffentlicht den bis dahin lokal entstandenen Stand. Die Versionen davor werden nicht als erfundene Git-Commits nachgestellt.

Nutzer- und Assistententexte sind bis auf neutrale lokale Pfade, normalisierte Frage-Antwort-/Bild-Wrapper und gegebenenfalls erkennbare Zugangsdaten erhalten. System-/Entwickleranweisungen, internes Reasoning, rohe Tool-Logs, automatische Pluginlisten und Rechnerkonfiguration gehören nicht zum veröffentlichten Dialog. Lokale App-Links in historischen Antworten sind historische Verweise; aktuelle Downloads stehen in der Repository-README.

Der Export enthält keine späteren Nachrichten nach seinem Zeitstempel und wird nicht automatisch auf zukünftige Gespräche erweitert. Der Exporter liegt unter [scripts/export-conversation.py](../../scripts/export-conversation.py); vor einer erneuten Veröffentlichung sind Text und Anhänge zu prüfen.
''')
print(f'Exported {len(messages)} messages; user={sum(m["role"] == "user" for m in messages)}, assistant={sum(m["role"] == "assistant" for m in messages)}')
