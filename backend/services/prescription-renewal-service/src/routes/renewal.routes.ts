/**
 * Renewal Routes
 * Express routes for renewal predictions and reminders
 * Task: T8-055
 */

import { Router } from 'express';
import { RenewalController } from '../controllers/RenewalController';
import { DataSource } from 'typeorm';

export const createRenewalRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const controller = new RenewalController(dataSource);

  // Prediction routes
  router.post('/predictions', controller.createPrediction);
  router.get('/predictions/:id', controller.getPrediction);
  router.get('/predictions/patient/:patientId', controller.getPatientPredictions);
  router.get('/predictions/pharmacy/:pharmacyId/pending', controller.getPharmacyPendingPredictions);
  router.get('/predictions/attention', controller.getAttentionPredictions);
  router.patch('/predictions/:id', controller.updatePrediction);
  router.post('/predictions/:id/approve', controller.approvePrediction);
  router.post('/predictions/:id/reject', controller.rejectPrediction);

  // Reminder routes
  router.get('/reminders/patient/:patientId', controller.getPatientReminders);
  router.post('/reminders', controller.createReminder);
  router.post('/reminders/process', controller.processDueReminders);
  router.delete('/reminders/:id', controller.cancelReminder);

  return router;
};
