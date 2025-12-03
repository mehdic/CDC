/**
 * Adherence Routes
 */

import { Router } from 'express';
import { adherenceController } from '../controllers/adherence.controller';

const router = Router();

// Patient adherence endpoints
router.get('/patient/:id', (req, res) => adherenceController.getPatientAdherence(req, res));
router.get('/patient/:id/medication/:medId', (req, res) => adherenceController.getPatientMedicationAdherence(req, res));
router.get('/patient/:id/history', (req, res) => adherenceController.getAdherenceHistory(req, res));
router.get('/alerts/patient/:id', (req, res) => adherenceController.getPatientAlerts(req, res));

// Doctor dashboard endpoints
router.get('/doctor/patients/poor-adherence', (req, res) => adherenceController.getPatientsWithPoorAdherence(req, res));

// Dispensation recording
router.post('/dispensation', (req, res) => adherenceController.recordDispensation(req, res));

// Alert management
router.patch('/alerts/:alertId/resolve', (req, res) => adherenceController.resolveAlert(req, res));

export default router;
