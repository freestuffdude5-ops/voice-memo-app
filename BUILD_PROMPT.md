# Voice Memo App Build Task

You are building a personal voice memo and daily notes app for Hayden.

## Project Location
`/home/user/clawd/projects/voice-memo-app/`

## The Ralph Wiggum Loop

Follow this iterative pattern until ALL user stories pass:

### 1. Read the PRD
Read `prd.json` to understand all user stories and acceptance criteria.

### 2. Check Progress  
Read `progress.txt` for any learnings from previous iterations.

### 3. Pick Next Story
Find the highest priority story where `passes: false`.

### 4. Execute
Complete the story following ALL acceptance criteria. Write real, working code.

### 5. Verify
Test your work. Does it actually work? Check the acceptance criteria one by one.

### 6. Update PRD
If the story passes all criteria, update `prd.json` setting `passes: true` for that story.

### 7. Log Learnings
Add any learnings or notes to `progress.txt`.

### 8. Repeat
Go back to step 3. Keep going until ALL stories have `passes: true`.

## Technical Guidelines

- **No build tools**: Vanilla HTML/CSS/JS only. Must work by opening index.html.
- **Modern JS**: Use ES6+ features, async/await, modules if needed.
- **IndexedDB**: For persistent storage. No external database.
- **Web Speech API**: For transcription. Free, built into browser.
- **MediaRecorder API**: For voice recording.
- **UI**: Make it STUNNING. Dark mode, animations, glass effects, gradients. Impress.

## Files to Create

```
/home/user/clawd/projects/voice-memo-app/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── app.js              # Main application logic
├── db.js               # IndexedDB wrapper
├── recorder.js         # Voice recording module
├── transcriber.js      # Speech recognition module
├── ui.js               # UI helpers and animations
├── prd.json            # (already exists) Update passes as you go
└── progress.txt        # (already exists) Log learnings
```

## Definition of Done

The project is DONE when:
1. ALL user stories in prd.json have `passes: true`
2. The app works by simply opening index.html in a browser
3. Voice recording, playback, and transcription all function
4. Notes persist across browser refresh
5. The UI is visually impressive

## Start Now

Read the PRD, pick the first incomplete story, and begin building. Don't stop until it's done.
