/**
 * API Smoke Tests for Voice Memo App
 *
 * Runs against a temporary server instance.
 * No external test framework — uses Node built-in assert + fetch.
 *
 * Usage: npm test
 */

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const PORT = 49123; // High port to avoid conflicts
const BASE = `http://localhost:${PORT}`;

// Use a temp DB so tests don't touch real data
const TEST_DATA_DIR = path.join(__dirname, '..', 'data-test');
const TEST_DB_PATH = path.join(TEST_DATA_DIR, 'notes.db');

let serverProcess;
let createdNoteId;

// ── Helpers ──────────────────────────────────────────────

async function startServer() {
  // Clean up any previous test DB
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  if (!fs.existsSync(TEST_DATA_DIR)) fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: String(PORT), DATA_DIR: TEST_DATA_DIR },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;

    serverProcess.stdout.on('data', (chunk) => {
      if (!started && chunk.toString().includes('running on port')) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (chunk) => {
      // Log but don't fail — some warnings are fine
      process.stderr.write(chunk);
    });

    serverProcess.on('error', reject);
    serverProcess.on('exit', (code) => {
      if (!started) reject(new Error(`Server exited before starting (code ${code})`));
    });

    // Timeout safety
    setTimeout(() => {
      if (!started) reject(new Error('Server failed to start within 10s'));
    }, 10000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
  // Clean up test DB
  try {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(TEST_DATA_DIR)) fs.rmdirSync(TEST_DATA_DIR);
  } catch { /* best effort */ }
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  return { status: res.status, data: json };
}

// ── Test runner ──────────────────────────────────────────

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

async function run() {
  console.log('\n🧪 Voice Memo API Tests\n');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✅ ${t.name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${t.name}`);
      console.log(`     ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  return failed;
}

// ── Tests ────────────────────────────────────────────────

test('GET /api/health returns ok', async () => {
  const { status, data } = await api('GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'ok');
  assert.ok(data.timestamp);
});

test('GET /api/notes returns empty array initially', async () => {
  const { status, data } = await api('GET', '/api/notes');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 0);
});

test('POST /api/notes creates a text note', async () => {
  const note = {
    id: 'test-note-1',
    type: 'text',
    title: 'Test Note',
    content: 'Hello from the test suite',
  };
  const { status, data } = await api('POST', '/api/notes', note);
  assert.equal(status, 201);
  assert.equal(data.id, 'test-note-1');
  assert.equal(data.type, 'text');
  assert.equal(data.title, 'Test Note');
  assert.equal(data.content, 'Hello from the test suite');
  assert.ok(data.createdAt);
  createdNoteId = data.id;
});

test('POST /api/notes creates a voice note', async () => {
  const note = {
    id: 'test-voice-1',
    type: 'voice',
    title: 'Voice Test',
    audioData: 'base64audiodatahere',
    audioDuration: 5.5,
    transcription: 'This is a voice test',
  };
  const { status, data } = await api('POST', '/api/notes', note);
  assert.equal(status, 201);
  assert.equal(data.type, 'voice');
  assert.equal(data.audioDuration, 5.5);
  assert.equal(data.transcription, 'This is a voice test');
});

test('GET /api/notes returns created notes', async () => {
  const { status, data } = await api('GET', '/api/notes');
  assert.equal(status, 200);
  assert.equal(data.length, 2);
});

test('GET /api/notes?type=text filters by type', async () => {
  const { status, data } = await api('GET', '/api/notes?type=text');
  assert.equal(status, 200);
  assert.equal(data.length, 1);
  assert.equal(data[0].type, 'text');
});

test('GET /api/notes?type=voice filters by type', async () => {
  const { status, data } = await api('GET', '/api/notes?type=voice');
  assert.equal(status, 200);
  assert.equal(data.length, 1);
  assert.equal(data[0].type, 'voice');
});

test('GET /api/notes/:id returns single note', async () => {
  const { status, data } = await api('GET', `/api/notes/${createdNoteId}`);
  assert.equal(status, 200);
  assert.equal(data.id, createdNoteId);
  assert.equal(data.title, 'Test Note');
});

test('GET /api/notes/:id returns 404 for missing note', async () => {
  const { status, data } = await api('GET', '/api/notes/nonexistent-id');
  assert.equal(status, 404);
  assert.ok(data.error);
});

test('PUT /api/notes/:id updates a note', async () => {
  const update = { title: 'Updated Title', content: 'Updated content' };
  const { status, data } = await api('PUT', `/api/notes/${createdNoteId}`, update);
  assert.equal(status, 200);
  assert.equal(data.title, 'Updated Title');
  assert.equal(data.content, 'Updated content');
});

test('PUT /api/notes/:id returns 404 for missing note', async () => {
  const { status } = await api('PUT', '/api/notes/nonexistent-id', { title: 'X' });
  assert.equal(status, 404);
});

test('GET /api/dates returns date counts', async () => {
  const { status, data } = await api('GET', '/api/dates');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 1);
  assert.ok(data[0].date);
  assert.ok(data[0].count >= 1);
});

test('GET /api/notes?date=today filters by date', async () => {
  const today = new Date().toISOString().split('T')[0];
  const { status, data } = await api('GET', `/api/notes?date=${today}`);
  assert.equal(status, 200);
  assert.ok(data.length >= 1);
});

test('DELETE /api/notes/:id deletes a note', async () => {
  const { status, data } = await api('DELETE', `/api/notes/${createdNoteId}`);
  assert.equal(status, 200);
  assert.equal(data.success, true);

  // Verify it's gone
  const { status: getStatus } = await api('GET', `/api/notes/${createdNoteId}`);
  assert.equal(getStatus, 404);
});

test('DELETE /api/notes/:id returns 404 for missing note', async () => {
  const { status } = await api('DELETE', '/api/notes/nonexistent-id');
  assert.equal(status, 404);
});

// ── Main ─────────────────────────────────────────────────

(async () => {
  try {
    console.log('Starting test server...');
    await startServer();
    console.log('Server ready.\n');

    const failures = await run();
    stopServer();
    process.exit(failures > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal:', err.message);
    stopServer();
    process.exit(1);
  }
})();
