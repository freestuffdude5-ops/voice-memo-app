# 🎙️ VoiceMemo

A personal voice memo and daily notes app with real-time transcription, audio playback, and a stunning dark UI. Built for capturing thoughts via voice or text.

## Features

- **Voice Recording** — Record memos with MediaRecorder API, see live duration timer
- **Real-time Transcription** — Web Speech API transcribes as you speak, with editable results
- **Text Notes** — Quick text note editor with auto-save
- **Audio Playback** — Play/pause with progress bar and duration display
- **Calendar View** — Browse notes by date with month navigation and preview panel
- **Stunning UI** — Dark glass-morphism design, smooth animations, gradients
- **PWA Ready** — Installable on mobile with proper manifest
- **Keyboard Shortcuts** — Power-user friendly

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (ES6+) |
| Backend | Node.js + Express |
| Database | sql.js (SQLite in-process) |
| Transcription | Web Speech API (browser-native) |
| Recording | MediaRecorder API |

## Getting Started

### Prerequisites

- Node.js >= 18.0.0

### Install & Run

```bash
git clone https://github.com/freestuffdude5-ops/voice-memo-app.git
cd voice-memo-app
npm install
npm start
```

The server starts at `http://localhost:3000`.

### Development

```bash
npm run dev    # Same as npm start (no build step needed)
```

## API Endpoints

### Health Check

```
GET /api/health
→ { "status": "ok", "timestamp": "..." }
```

### Notes CRUD

```
GET    /api/notes              # List all notes (query: ?date=YYYY-MM-DD&type=voice|text)
GET    /api/notes/:id          # Get single note
POST   /api/notes              # Create note
PUT    /api/notes/:id          # Update note (title, content, transcription)
DELETE /api/notes/:id          # Delete note
```

### Calendar

```
GET    /api/dates              # Get dates with note counts
```

### Create Note Body

```json
{
  "id": "optional-custom-id",
  "type": "text|voice",
  "title": "Note title",
  "content": "Text content",
  "audioData": "base64 audio (voice memos)",
  "audioDuration": 12.5,
  "transcription": "Transcribed text"
}
```

### Update Note Body

```json
{
  "title": "Updated title",
  "content": "Updated content",
  "transcription": "Updated transcription"
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+N` | New note |
| `Space` | Play/pause audio |
| `1` | Switch to Notes view |
| `2` | Switch to Voice view |
| `3` | Switch to Calendar view |

## Project Structure

```
voice-memo-app/
├── server.js              # Express API server + SQLite
├── package.json
├── data/
│   └── notes.db           # SQLite database (auto-created)
├── public/
│   ├── index.html         # Main app shell
│   ├── styles.css         # Dark theme + glass-morphism
│   ├── app.js             # App initialization + routing
│   ├── ui.js              # UI rendering + interactions
│   ├── db.js              # API client (fetch wrapper)
│   ├── recorder.js        # MediaRecorder integration
│   ├── transcriber.js     # Web Speech API integration
│   └── manifest.json      # PWA manifest
├── test/
│   └── api.test.js        # API smoke tests
├── prd.json               # Product requirements
├── progress.txt           # Build progress log
└── BUILD_PROMPT.md        # Original build task
```

## Running Tests

```bash
npm test
```

Runs API smoke tests against a temporary server instance. No external dependencies required — uses Node's built-in `assert` and `fetch`.

## License

MIT
