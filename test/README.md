# Voice Memo App Tests

This directory contains automated tests for the Voice Memo App API.

## Running Tests

```bash
npm test
```

## Test Coverage

The test suite covers all API endpoints:

- **GET /api/notes** - List all notes with optional filtering
- **GET /api/notes/:id** - Retrieve a specific note
- **POST /api/notes** - Create new notes (text and voice)
- **PUT /api/notes/:id** - Update existing notes
- **DELETE /api/notes/:id** - Delete notes
- **GET /api/health** - Health check endpoint

## Test Framework

Uses Node.js built-in test runner (Node 18+), requiring no additional test dependencies.

## Writing New Tests

Tests follow the standard Node.js test format:

```javascript
const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Feature Name', () => {
  test('should do something', async () => {
    // Test code
    assert.strictEqual(actual, expected);
  });
});
```

## CI/CD Integration

These tests can be easily integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
```
