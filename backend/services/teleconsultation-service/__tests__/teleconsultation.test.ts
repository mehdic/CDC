/**
 * Integration Tests for Teleconsultation Service
 */

import request from 'supertest';
import app from '../src/index';
import teleconsultationRepository from '../src/repositories/teleconsultation.repository';

describe('Teleconsultation Service - Integration Tests', () => {
  beforeEach(() => {
    // Clear database before each test
    teleconsultationRepository.deleteAll();
  });

  describe('POST /api/teleconsultation/sessions', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({
          pharmacyId: 'pharmacy-123',
          notes: 'Initial consultation',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('session');
      expect(response.body.session).toHaveProperty('id');
      expect(response.body.session.pharmacyId).toBe('pharmacy-123');
      expect(response.body.session.status).toBe('scheduled');
    });

    it('should require pharmacyId', async () => {
      const response = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('pharmacyId');
    });

    it('should validate scheduledAt date', async () => {
      const response = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({
          pharmacyId: 'pharmacy-123',
          scheduledAt: 'invalid-date',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/teleconsultation/sessions/:id', () => {
    it('should retrieve session by ID', async () => {
      // Create session first
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      // Retrieve session
      const response = await request(app).get(`/api/teleconsultation/sessions/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.session.id).toBe(sessionId);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app).get('/api/teleconsultation/sessions/999');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/teleconsultation/sessions/:id', () => {
    it('should update session status', async () => {
      // Create session
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      // Update status
      const response = await request(app)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.session.status).toBe('active');
      expect(response.body.session.startedAt).toBeDefined();
    });

    it('should validate status transitions', async () => {
      // Create session
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      // Try invalid transition (scheduled -> completed)
      const response = await request(app)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Invalid status transition');
    });

    it('should update session notes', async () => {
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      const response = await request(app)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ notes: 'Updated notes' });

      expect(response.status).toBe(200);
      expect(response.body.session.notes).toBe('Updated notes');
    });
  });

  describe('POST /api/teleconsultation/sessions/:id/participants', () => {
    it('should add participant to session', async () => {
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      const response = await request(app)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({
          userId: 'user-123',
          role: 'doctor',
        });

      expect(response.status).toBe(201);
      expect(response.body.participant.userId).toBe('user-123');
      expect(response.body.participant.role).toBe('doctor');
    });

    it('should validate role', async () => {
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      const response = await request(app)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({
          userId: 'user-123',
          role: 'invalid-role',
        });

      expect(response.status).toBe(400);
    });

    it('should not add duplicate participant', async () => {
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      // Add participant first time
      await request(app)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({
          userId: 'user-123',
          role: 'doctor',
        });

      // Try to add same participant again
      const response = await request(app)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({
          userId: 'user-123',
          role: 'doctor',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /api/teleconsultation/sessions/:id/participants/:participantId', () => {
    it('should remove participant from session', async () => {
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      // Add participant
      const addResponse = await request(app)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({
          userId: 'user-123',
          role: 'doctor',
        });

      const participantId = addResponse.body.participant.id;

      // Remove participant
      const response = await request(app).delete(
        `/api/teleconsultation/sessions/${sessionId}/participants/${participantId}`
      );

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/teleconsultation/sessions/:id/recordings', () => {
    it('should start recording for active session', async () => {
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      // Make session active
      await request(app)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      // Start recording
      const response = await request(app).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      expect(response.status).toBe(201);
      expect(response.body.recording).toHaveProperty('id');
      expect(response.body.recording.startedAt).toBeDefined();
    });

    it('should not start recording for non-active session', async () => {
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      const response = await request(app).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /api/teleconsultation/sessions/:id/recordings/:recordingId', () => {
    it('should stop recording', async () => {
      const createResponse = await request(app)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-123' });

      const sessionId = createResponse.body.session.id;

      // Make session active
      await request(app)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      // Start recording
      const startResponse = await request(app).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      const recordingId = startResponse.body.recording.id;

      // Stop recording
      const response = await request(app).delete(
        `/api/teleconsultation/sessions/${sessionId}/recordings/${recordingId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.recording.endedAt).toBeDefined();
      expect(response.body.recording.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('teleconsultation-service');
    });
  });
});
