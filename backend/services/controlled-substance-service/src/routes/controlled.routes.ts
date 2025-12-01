import { Router } from 'express';
import { ControlledController } from '../controllers/controlled.controller';

const router = Router();
const controller = new ControlledController();

/**
 * Controlled Substance Routes
 * All routes require authentication and proper authorization
 */

// Prescription validation
router.post('/validate', controller.validatePrescription);

// Dispensation recording
router.post('/dispense', controller.dispenseControlledSubstance);

// Patient history
router.get('/patient/:patientId/history', controller.getPatientHistory);

// Compliance reports
router.get('/reports', controller.getComplianceReports);

// Alerts
router.get('/alerts', controller.getAlerts);
router.post('/alerts/:alertId/resolve', controller.resolveAlert);

// Substances
router.get('/substances', controller.getActiveSubstances);

// Trends
router.get('/trends', controller.getTrendReport);

export default router;
