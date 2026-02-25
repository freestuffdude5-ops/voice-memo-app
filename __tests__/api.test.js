const request = require('supertest');
const { app, initDatabase } = require('../server');
const fs = require('fs');
const path = require('path');

// Test database path
const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'notes.db');

describe('Voice Memo API', () => {
    beforeAll(async () => {
        // Clean up test database if it exists
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
        // Initialize database before tests
        await initDatabase();
    });

    afterAll(() => {
        // Clean up test database after tests
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
    });

    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', 'ok');
            expect(res.body).toHaveProperty('timestamp');
        });
    });

    describe('POST /api/notes', () => {
        it('should create a text note', async () => {
            const noteData = {
                type: 'text',
                title: 'Test Note',
                content: 'This is a test note'
            };

            const res = await request(app)
                .post('/api/notes')
                .send(noteData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.type).toBe('text');
            expect(res.body.title).toBe('Test Note');
            expect(res.body.content).toBe('This is a test note');
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('updatedAt');
        });

        it('should create a voice note', async () => {
            const noteData = {
                type: 'voice',
                audioData: 'data:audio/webm;base64,test',
                audioDuration: 5.5,
                transcription: 'Test transcription'
            };

            const res = await request(app)
                .post('/api/notes')
                .send(noteData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.type).toBe('voice');
            expect(res.body.audioData).toBe('data:audio/webm;base64,test');
            expect(res.body.audioDuration).toBe(5.5);
            expect(res.body.transcription).toBe('Test transcription');
        });
    });

    describe('GET /api/notes', () => {
        it('should retrieve all notes', async () => {
            const res = await request(app).get('/api/notes');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should filter notes by type', async () => {
            const res = await request(app).get('/api/notes?type=text');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach(note => {
                expect(note.type).toBe('text');
            });
        });
    });

    describe('GET /api/notes/:id', () => {
        let testNoteId;

        beforeAll(async () => {
            // Create a note to test retrieval
            const res = await request(app)
                .post('/api/notes')
                .send({ type: 'text', title: 'Retrieve Test', content: 'Test content' });
            testNoteId = res.body.id;
        });

        it('should retrieve a specific note by id', async () => {
            const res = await request(app).get(`/api/notes/${testNoteId}`);
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(testNoteId);
            expect(res.body.title).toBe('Retrieve Test');
        });

        it('should return 404 for non-existent note', async () => {
            const res = await request(app).get('/api/notes/nonexistent-id');
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Note not found');
        });
    });

    describe('PUT /api/notes/:id', () => {
        let testNoteId;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/notes')
                .send({ type: 'text', title: 'Update Test', content: 'Original content' });
            testNoteId = res.body.id;
        });

        it('should update a note', async () => {
            const updates = {
                title: 'Updated Title',
                content: 'Updated content'
            };

            const res = await request(app)
                .put(`/api/notes/${testNoteId}`)
                .send(updates);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(testNoteId);
            expect(res.body.title).toBe('Updated Title');
            expect(res.body.content).toBe('Updated content');
        });

        it('should return 404 for non-existent note', async () => {
            const res = await request(app)
                .put('/api/notes/nonexistent-id')
                .send({ title: 'New Title' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/notes/:id', () => {
        let testNoteId;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/notes')
                .send({ type: 'text', title: 'Delete Test', content: 'To be deleted' });
            testNoteId = res.body.id;
        });

        it('should delete a note', async () => {
            const res = await request(app).delete(`/api/notes/${testNoteId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);

            // Verify note is actually deleted
            const getRes = await request(app).get(`/api/notes/${testNoteId}`);
            expect(getRes.status).toBe(404);
        });

        it('should return 404 for non-existent note', async () => {
            const res = await request(app).delete('/api/notes/nonexistent-id');
            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/dates', () => {
        it('should return dates with note counts', async () => {
            const res = await request(app).get('/api/dates');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('date');
                expect(res.body[0]).toHaveProperty('count');
            }
        });
    });
});
