# Voice Memo App

A voice memo and notes application with sync capabilities. Built with Express.js and SQLite (sql.js).

## Features

- 📝 Create text notes
- 🎙️ Record voice memos with audio data
- 🔍 Filter notes by date and type
- 📅 Calendar view of notes by date
- 💾 Persistent SQLite storage

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server runs on port 3000 by default (configurable via `PORT` environment variable).

## API Endpoints

### Health Check
- `GET /api/health` - Returns server status

### Notes
- `GET /api/notes` - Get all notes (supports `?date=YYYY-MM-DD` and `?type=text|voice` filters)
- `GET /api/notes/:id` - Get a single note by ID
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Dates
- `GET /api/dates` - Get all dates with note counts (for calendar view)

## Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
voice-memo-app/
├── server.js           # Express server and API routes
├── public/             # Frontend static files
├── data/               # SQLite database storage
├── __tests__/          # Test files
└── package.json        # Dependencies and scripts
```

## Requirements

- Node.js >= 18.0.0

## License

MIT
