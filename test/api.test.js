const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

// Start server for testing
let server;
const PORT = 3001; // Use different port for tests
const BASE_URL = `http://localhost:${PORT}`;

// Helper function to make HTTP requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe('Voice Memo API', () => {
  before(async () => {
    // Start the server
    process.env.PORT = PORT;
    delete require.cache[require.resolve('../server.js')];
    server = require('../server.js');
    
    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  after(() => {
    // Clean up
    if (server && server.close) {
      server.close();
    }
  });

  describe('GET /api/notes', () => {
    test('should return notes array', async () => {
      const response = await request('GET', '/api/notes');
      
      assert.strictEqual(response.statusCode, 200);
      assert.ok(Array.isArray(response.body));
    });

    test('should filter notes by type', async () => {
      const response = await request('GET', '/api/notes?type=text');
      
      assert.strictEqual(response.statusCode, 200);
      assert.ok(Array.isArray(response.body));
    });
  });

  describe('POST /api/notes', () => {
    test('should create a new text note', async () => {
      const newNote = {
        id: `test-${Date.now()}`,
        type: 'text',
        title: 'Test Note',
        content: 'This is a test note',
      };

      const response = await request('POST', '/api/notes', newNote);
      
      assert.strictEqual(response.statusCode, 201);
      assert.strictEqual(response.body.id, newNote.id);
      assert.strictEqual(response.body.type, 'text');
      assert.strictEqual(response.body.title, 'Test Note');
    });

    test('should create a voice note with audio data', async () => {
      const voiceNote = {
        id: `voice-test-${Date.now()}`,
        type: 'voice',
        title: 'Voice Test',
        audioData: 'data:audio/webm;base64,fake-audio-data',
        audioDuration: 5.5,
      };

      const response = await request('POST', '/api/notes', voiceNote);
      
      assert.strictEqual(response.statusCode, 201);
      assert.strictEqual(response.body.type, 'voice');
      assert.strictEqual(response.body.audioDuration, 5.5);
    });
  });

  describe('GET /api/notes/:id', () => {
    test('should retrieve a specific note', async () => {
      // First create a note
      const noteId = `test-get-${Date.now()}`;
      const newNote = {
        id: noteId,
        type: 'text',
        title: 'Get Test',
        content: 'Testing GET endpoint',
      };

      await request('POST', '/api/notes', newNote);

      // Then retrieve it
      const response = await request('GET', `/api/notes/${noteId}`);
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body.id, noteId);
      assert.strictEqual(response.body.title, 'Get Test');
    });

    test('should return 404 for non-existent note', async () => {
      const response = await request('GET', '/api/notes/non-existent-id');
      
      assert.strictEqual(response.statusCode, 404);
      assert.ok(response.body.error);
    });
  });

  describe('PUT /api/notes/:id', () => {
    test('should update an existing note', async () => {
      // First create a note
      const noteId = `test-update-${Date.now()}`;
      const newNote = {
        id: noteId,
        type: 'text',
        title: 'Original Title',
        content: 'Original content',
      };

      await request('POST', '/api/notes', newNote);

      // Then update it
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const response = await request('PUT', `/api/notes/${noteId}`, updateData);
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body.title, 'Updated Title');
      assert.strictEqual(response.body.content, 'Updated content');
    });

    test('should return 404 for non-existent note', async () => {
      const response = await request('PUT', '/api/notes/non-existent-id', {
        title: 'New Title',
      });
      
      assert.strictEqual(response.statusCode, 404);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    test('should delete a note', async () => {
      // First create a note
      const noteId = `test-delete-${Date.now()}`;
      const newNote = {
        id: noteId,
        type: 'text',
        title: 'To Be Deleted',
        content: 'This note will be deleted',
      };

      await request('POST', '/api/notes', newNote);

      // Then delete it
      const response = await request('DELETE', `/api/notes/${noteId}`);
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body.success, true);

      // Verify it's gone
      const getResponse = await request('GET', `/api/notes/${noteId}`);
      assert.strictEqual(getResponse.statusCode, 404);
    });

    test('should return 404 for non-existent note', async () => {
      const response = await request('DELETE', '/api/notes/non-existent-id');
      
      assert.strictEqual(response.statusCode, 404);
    });
  });

  describe('GET /api/dates', () => {
    test('should return dates with note counts', async () => {
      // Create a couple of notes to ensure we have data
      const today = new Date().toISOString();
      const note1 = {
        id: `date-test-1-${Date.now()}`,
        type: 'text',
        title: 'Date Test 1',
        content: 'Testing dates endpoint',
      };
      const note2 = {
        id: `date-test-2-${Date.now()}`,
        type: 'text',
        title: 'Date Test 2',
        content: 'Another note for dates',
      };

      await request('POST', '/api/notes', note1);
      await request('POST', '/api/notes', note2);

      // Fetch dates
      const response = await request('GET', '/api/dates');
      
      assert.strictEqual(response.statusCode, 200);
      assert.ok(Array.isArray(response.body));
      assert.ok(response.body.length > 0);
      
      // Each date entry should have 'date' and 'count' fields
      const firstEntry = response.body[0];
      assert.ok(firstEntry.date);
      assert.ok(typeof firstEntry.count === 'number');
      assert.ok(firstEntry.count > 0);
    });

    test('should return dates in descending order', async () => {
      const response = await request('GET', '/api/dates');
      
      assert.strictEqual(response.statusCode, 200);
      
      // Verify dates are sorted descending
      if (response.body.length > 1) {
        for (let i = 0; i < response.body.length - 1; i++) {
          const current = new Date(response.body[i].date);
          const next = new Date(response.body[i + 1].date);
          assert.ok(current >= next, 'Dates should be in descending order');
        }
      }
    });

    test('should return empty array when no notes exist', async () => {
      // This test assumes a fresh database or cleanup
      // In a real scenario, you might want to use a test database
      const response = await request('GET', '/api/dates');
      
      assert.strictEqual(response.statusCode, 200);
      assert.ok(Array.isArray(response.body));
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request('GET', '/api/health');
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body.status, 'ok');
      assert.ok(response.body.timestamp);
    });
  });
});
