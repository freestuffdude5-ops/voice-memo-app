# 🎙️ Voice Memo App

A personal voice memo and daily notes application with sync capabilities. Record voice memos, take text notes, and have everything automatically transcribed and stored with a clean, modern interface.

## ✨ Features

- **Voice Recording** - Record voice memos with one tap using MediaRecorder API
- **Auto-Transcription** - Automatic speech-to-text using Web Speech API (built-in, no API key needed)
- **Text Notes** - Quick text notes for when typing is faster
- **Persistent Storage** - Server-side SQLite database with sync
- **Daily View** - Organize notes by date with calendar navigation
- **Search & Filter** - Find notes by type, date, or content
- **Modern UI** - Dark mode, glass effects, smooth animations
- **Offline-First** - IndexedDB client storage with server sync

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/freestuffdude5-ops/voice-memo-app.git
cd voice-memo-app

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
voice-memo-app/
├── server.js              # Express server with REST API
├── data/                  # SQLite database storage
│   └── notes.db          # Notes database (auto-created)
├── public/               # Frontend files
│   ├── index.html        # Main HTML
│   ├── styles.css        # All styling
│   ├── app.js            # Main application logic
│   ├── db.js             # IndexedDB wrapper
│   ├── recorder.js       # Voice recording module
│   ├── transcriber.js    # Speech recognition module
│   ├── ui.js             # UI helpers and animations
│   └── manifest.json     # PWA manifest
├── package.json          # Dependencies and scripts
└── prd.json             # Product requirements document
```

## 🔌 API Reference

### Notes Endpoints

#### Get All Notes
```http
GET /api/notes
Query Parameters:
  - date: ISO date string (optional) - filter by creation date
  - type: "voice" | "text" (optional) - filter by note type
```

#### Get Single Note
```http
GET /api/notes/:id
```

#### Create Note
```http
POST /api/notes
Body: {
  id?: string,           // Optional, auto-generated if not provided
  type: "voice" | "text",
  title?: string,
  content?: string,
  audioData?: string,    // Base64 encoded audio
  audioDuration?: number,
  transcription?: string
}
```

#### Update Note
```http
PUT /api/notes/:id
Body: {
  title?: string,
  content?: string,
  transcription?: string
}
```

#### Delete Note
```http
DELETE /api/notes/:id
```

#### Get Dates with Notes
```http
GET /api/dates
Returns array of dates with note counts for calendar view
```

#### Health Check
```http
GET /api/health
```

## 🛠️ Tech Stack

### Backend
- **Express** - Web server framework
- **sql.js** - SQLite compiled to WebAssembly
- **CORS** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No framework, pure ES6+
- **IndexedDB** - Client-side persistent storage
- **MediaRecorder API** - Audio recording
- **Web Speech API** - Speech-to-text transcription
- **CSS3** - Modern styling with animations

## 🎨 UI Features

- **Dark Mode** - Easy on the eyes
- **Glass Morphism** - Modern frosted glass effects
- **Smooth Animations** - Page transitions and interactions
- **Responsive Design** - Works on desktop and mobile
- **Calendar View** - Visual date picker for navigation

## 🔒 Data Storage

### Client Side (IndexedDB)
- Local cache for offline access
- Syncs with server on connection

### Server Side (SQLite)
- Persistent storage in `data/notes.db`
- Automatic backups on each write
- Full CRUD operations

## 📝 Development

### Run in Development Mode
```bash
npm run dev
```

### Testing
Start the server and verify:
1. Server starts without errors
2. Can access http://localhost:3000
3. Can create voice and text notes
4. Notes persist after refresh

### Contributing
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Open a Pull Request

## 🐛 Troubleshooting

**Server won't start:**
- Check Node version: `node --version` (must be >= 18)
- Ensure port 3000 is available
- Delete `data/notes.db` and restart if corrupted

**Audio recording not working:**
- Ensure microphone permissions are granted
- Check browser compatibility (Chrome/Edge recommended)
- Use HTTPS or localhost (required for MediaRecorder)

**Transcription not working:**
- Web Speech API requires internet connection
- Check browser compatibility (Chrome has best support)
- Ensure microphone permissions are granted

## 📄 License

MIT

## 🤝 Support

For issues or questions, open an issue on GitHub.

---

Built with ⚡ by Clawd
