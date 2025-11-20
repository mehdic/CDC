/**
 * Teleconsultation API Routes
 * REST API endpoints for teleconsultation operations
 */

import { Router } from 'express';
import {
  createSession,
  getSession,
  listSessions,
  updateSession,
  addParticipant,
  removeParticipant,
  getParticipants,
  startRecording,
  stopRecording,
  getRecordings,
} from './controllers/teleconsultation.controller';

const router = Router();

// Session routes
router.post('/sessions', createSession);
router.get('/sessions', listSessions);
router.get('/sessions/:id', getSession);
router.patch('/sessions/:id', updateSession);

// Participant routes
router.post('/sessions/:id/participants', addParticipant);
router.delete('/sessions/:id/participants/:participantId', removeParticipant);
router.get('/sessions/:id/participants', getParticipants);

// Recording routes
router.post('/sessions/:id/recordings', startRecording);
router.delete('/sessions/:id/recordings/:recordingId', stopRecording);
router.get('/sessions/:id/recordings', getRecordings);

export default router;
