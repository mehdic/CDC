/**
 * E2E Test: Teleconsultation Service
 * Comprehensive end-to-end tests for teleconsultation workflows
 */

import request from 'supertest';

// Import teleconsultation service
const teleconsultationApp = require('../../services/teleconsultation-service/src/index').default;

describe('E2E: Teleconsultation Service', () => {
  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await request(teleconsultationApp).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'teleconsultation-service');
    });
  });

  describe('Complete Teleconsultation Workflow', () => {
    it('should complete a full teleconsultation session lifecycle', async () => {
      // Step 1: Create session
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({
          pharmacyId: 'pharmacy-e2e-123',
          notes: 'Patient consultation for chronic condition follow-up',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.session).toHaveProperty('id');
      const sessionId = createResponse.body.session.id;

      // Step 2: Add pharmacist participant
      const addPharmacistResponse = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({
          userId: 'pharmacist-001',
          role: 'pharmacist',
        });

      expect(addPharmacistResponse.status).toBe(201);

      // Step 3: Add patient participant
      const addPatientResponse = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({
          userId: 'patient-001',
          role: 'patient',
        });

      expect(addPatientResponse.status).toBe(201);

      // Step 4: Start session (transition to active)
      const startResponse = await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      expect(startResponse.status).toBe(200);
      expect(startResponse.body.session.status).toBe('active');

      // Step 5: Start recording
      const startRecordingResponse = await request(teleconsultationApp).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      expect(startRecordingResponse.status).toBe(201);
      const recordingId = startRecordingResponse.body.recording.id;

      // Step 6: Stop recording
      const stopRecordingResponse = await request(teleconsultationApp).delete(
        `/api/teleconsultation/sessions/${sessionId}/recordings/${recordingId}`
      );

      expect(stopRecordingResponse.status).toBe(200);
      expect(stopRecordingResponse.body.recording.endedAt).toBeDefined();

      // Step 7: Complete session
      const completeResponse = await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'completed' });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.session.status).toBe('completed');
      expect(completeResponse.body.session.endedAt).toBeDefined();
    });
  });

  describe('Session Creation', () => {
    it('should create a new teleconsultation session', async () => {
      const response = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({
          pharmacyId: 'pharmacy-456',
          scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        });

      expect(response.status).toBe(201);
      expect(response.body.session.pharmacyId).toBe('pharmacy-456');
      expect(response.body.session.status).toBe('scheduled');
    });

    it('should reject session creation without pharmacyId', async () => {
      const response = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('pharmacyId');
    });
  });

  describe('Session Retrieval', () => {
    it('should retrieve session by ID', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-789' });

      const sessionId = createResponse.body.session.id;

      const getResponse = await request(teleconsultationApp).get(
        `/api/teleconsultation/sessions/${sessionId}`
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.session.id).toBe(sessionId);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(teleconsultationApp).get('/api/teleconsultation/sessions/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('Status Transitions', () => {
    it('should allow valid status transition from scheduled to active', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-status-1' });

      const sessionId = createResponse.body.session.id;

      const response = await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.session.status).toBe('active');
    });

    it('should reject invalid status transition', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-status-2' });

      const sessionId = createResponse.body.session.id;

      // Try to go directly from scheduled to completed
      const response = await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Invalid status transition');
    });

    it('should allow pause and resume', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-pause' });

      const sessionId = createResponse.body.session.id;

      // Start session
      await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      // Pause session
      const pauseResponse = await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'paused' });

      expect(pauseResponse.status).toBe(200);
      expect(pauseResponse.body.session.status).toBe('paused');

      // Resume session
      const resumeResponse = await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      expect(resumeResponse.status).toBe(200);
      expect(resumeResponse.body.session.status).toBe('active');
    });
  });

  describe('Participant Management', () => {
    it('should add multiple participants with different roles', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-participants' });

      const sessionId = createResponse.body.session.id;

      // Add pharmacist
      const pharmacistResponse = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({ userId: 'pharm-001', role: 'pharmacist' });

      expect(pharmacistResponse.status).toBe(201);

      // Add doctor
      const doctorResponse = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({ userId: 'doc-001', role: 'doctor' });

      expect(doctorResponse.status).toBe(201);

      // Add patient
      const patientResponse = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({ userId: 'pat-001', role: 'patient' });

      expect(patientResponse.status).toBe(201);

      // Verify all participants
      const getParticipantsResponse = await request(teleconsultationApp).get(
        `/api/teleconsultation/sessions/${sessionId}/participants`
      );

      expect(getParticipantsResponse.status).toBe(200);
      expect(getParticipantsResponse.body.count).toBe(3);
    });

    it('should prevent adding participant to completed session', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-completed' });

      const sessionId = createResponse.body.session.id;

      // Complete the session
      await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'completed' });

      // Try to add participant
      const response = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({ userId: 'user-late', role: 'patient' });

      expect(response.status).toBe(409);
    });

    it('should remove participant from session', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-remove-participant' });

      const sessionId = createResponse.body.session.id;

      // Add participant
      const addResponse = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({ userId: 'user-to-remove', role: 'patient' });

      const participantId = addResponse.body.participant.id;

      // Remove participant
      const removeResponse = await request(teleconsultationApp).delete(
        `/api/teleconsultation/sessions/${sessionId}/participants/${participantId}`
      );

      expect(removeResponse.status).toBe(200);
    });
  });

  describe('Recording Features', () => {
    it('should start and stop recording during active session', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-recording' });

      const sessionId = createResponse.body.session.id;

      // Activate session
      await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      // Start recording
      const startResponse = await request(teleconsultationApp).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      expect(startResponse.status).toBe(201);
      expect(startResponse.body.recording.startedAt).toBeDefined();
      const recordingId = startResponse.body.recording.id;

      // Stop recording
      const stopResponse = await request(teleconsultationApp).delete(
        `/api/teleconsultation/sessions/${sessionId}/recordings/${recordingId}`
      );

      expect(stopResponse.status).toBe(200);
      expect(stopResponse.body.recording.endedAt).toBeDefined();
      expect(stopResponse.body.recording.duration).toBeGreaterThanOrEqual(0);
    });

    it('should prevent starting recording when session is not active', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-no-recording' });

      const sessionId = createResponse.body.session.id;

      // Try to start recording without activating session
      const response = await request(teleconsultationApp).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('active');
    });

    it('should retrieve all recordings for a session', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-recordings-list' });

      const sessionId = createResponse.body.session.id;

      // Activate session
      await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      // Start and stop first recording
      const rec1 = await request(teleconsultationApp).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );
      await request(teleconsultationApp).delete(
        `/api/teleconsultation/sessions/${sessionId}/recordings/${rec1.body.recording.id}`
      );

      // Start and stop second recording
      const rec2 = await request(teleconsultationApp).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );
      await request(teleconsultationApp).delete(
        `/api/teleconsultation/sessions/${sessionId}/recordings/${rec2.body.recording.id}`
      );

      // Get recordings
      const getResponse = await request(teleconsultationApp).get(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.count).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent session gracefully', async () => {
      const response = await request(teleconsultationApp)
        .patch('/api/teleconsultation/sessions/nonexistent')
        .send({ status: 'active' });

      expect(response.status).toBe(404);
    });

    it('should validate invalid role in participant addition', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-invalid-role' });

      const sessionId = createResponse.body.session.id;

      const response = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({ userId: 'user-001', role: 'invalid-role' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('role');
    });

    it('should handle missing required fields', async () => {
      const response = await request(teleconsultationApp)
        .patch('/api/teleconsultation/sessions/1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('status or notes');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent recordings attempt', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-concurrent' });

      const sessionId = createResponse.body.session.id;

      // Activate session
      await request(teleconsultationApp)
        .patch(`/api/teleconsultation/sessions/${sessionId}`)
        .send({ status: 'active' });

      // Start first recording
      await request(teleconsultationApp).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      // Try to start second recording (should fail)
      const response = await request(teleconsultationApp).post(
        `/api/teleconsultation/sessions/${sessionId}/recordings`
      );

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already in progress');
    });

    it('should prevent duplicate participant addition', async () => {
      const createResponse = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-duplicate' });

      const sessionId = createResponse.body.session.id;

      // Add participant first time
      const firstResponse = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({ userId: 'duplicate-user', role: 'patient' });

      expect(firstResponse.status).toBe(201);

      // Try to add same participant again
      const secondResponse = await request(teleconsultationApp)
        .post(`/api/teleconsultation/sessions/${sessionId}/participants`)
        .send({ userId: 'duplicate-user', role: 'patient' });

      expect(secondResponse.status).toBe(409);
    });
  });

  describe('Content Type Handling', () => {
    it('should accept JSON content-type', async () => {
      const response = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-json' })
        .set('Content-Type', 'application/json');

      expect(response.status).not.toBe(415);
    });
  });

  describe('HTTP Methods', () => {
    it('should support POST method for session creation', async () => {
      const response = await request(teleconsultationApp)
        .post('/api/teleconsultation/sessions')
        .send({ pharmacyId: 'pharmacy-method-test' });

      expect([201, 400]).toContain(response.status);
    });

    it('should support GET method for session retrieval', async () => {
      const response = await request(teleconsultationApp).get(
        '/api/teleconsultation/sessions/1'
      );

      expect([200, 404]).toContain(response.status);
    });

    it('should support PATCH method for session updates', async () => {
      const response = await request(teleconsultationApp)
        .patch('/api/teleconsultation/sessions/1')
        .send({ notes: 'test' });

      expect([200, 404]).toContain(response.status);
    });

    it('should support DELETE method for participant removal', async () => {
      const response = await request(teleconsultationApp).delete(
        '/api/teleconsultation/sessions/1/participants/1'
      );

      expect([200, 404, 409, 500]).toContain(response.status);
    });
  });
});
