# Voice Memo App

A lightweight voice memo and notes application with sync capabilities, built with vanilla JavaScript and Express.

## Features

- 🎙️ **Voice Recording** - Record audio memos directly in your browser
- 📝 **Text Notes** - Create and manage text-based notes
- 🔄 **Sync** - Built-in sync capabilities to keep your data consistent
- 💾 **Local Storage** - SQLite database for reliable data persistence
- 📱 **PWA Support** - Progressive Web App features via manifest.json
- 🎨 **Clean UI** - Simple, intuitive interface

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (via sql.js)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Audio**: Web Audio API
- **Storage**: File-based SQLite database

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/freestuffdude5-ops/voice-memo-app.git
cd voice-memo-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Development

Run in development mode:
```bash
npm run dev
```

The server will start on port 3000 by default. You can override this with the `PORT` environment variable:
```bash
PORT=8080 npm start
```

## Project Structure

```
voice-memo-app/
├── data/              # SQLite database storage
├── public/            # Frontend files
│   ├── app.js         # Main application logic
│   ├── db.js          # Client-side database management
│   ├── index.html     # Main HTML file
│   ├── manifest.json  # PWA manifest
│   ├── recorder.js    # Audio recording functionality
│   ├── styles.css     # Application styles
│   ├── transcriber.js # Audio transcription logic
│   └── ui.js          # UI components and interactions
├── scripts/           # Build and utility scripts
├── server.js          # Express server and API routes
└── package.json       # Dependencies and scripts
```

## API Endpoints

- `GET /api/notes` - Retrieve all notes
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update an existing note
- `DELETE /api/notes/:id` - Delete a note
- `POST /api/sync` - Sync notes across devices

## Database Schema

### Notes Table
- `id` (TEXT PRIMARY KEY) - Unique identifier
- `type` (TEXT NOT NULL) - Note type (voice/text)
- `title` (TEXT) - Note title
- `content` (TEXT) - Text content
- `audioData` (TEXT) - Base64-encoded audio data
- `audioDuration` (REAL) - Audio duration in seconds
- `transcription` (TEXT) - Audio transcription
- `createdAt` (TEXT NOT NULL) - Creation timestamp
- `updatedAt` (TEXT NOT NULL) - Last update timestamp

## Deployment

### Railway (Recommended)

This app is configured for Railway deployment:

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Node.js project
3. No additional configuration needed (uses package.json start script)

### Manual Deployment

Ensure the following:
- Node.js 18+ is installed
- Data directory is writable
- PORT environment variable is set (or defaults to 3000)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ⚡ by Clawd
