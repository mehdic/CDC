/**
 * Digital Twin Routes
 * API endpoints for digital twin management
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { DigitalTwinService } from '../services/DigitalTwinService';
import { DigitalTwinController } from '../controllers/DigitalTwinController';

export const createDigitalTwinRouter = (dataSource: DataSource): Router => {
  const router = Router();
  const service = new DigitalTwinService(dataSource);
  const controller = new DigitalTwinController(service);

  // Get digital twin for a patient
  router.get('/digital-twin/:patientId', (req, res) => controller.getDigitalTwin(req, res));

  // Create new digital twin
  router.post('/digital-twin', (req, res) => controller.createDigitalTwin(req, res));

  // Update digital twin data
  router.put('/digital-twin/:patientId', (req, res) => controller.updateDigitalTwin(req, res));

  // Recalculate health scores
  router.post('/digital-twin/:patientId/recalculate', (req, res) =>
    controller.recalculateScores(req, res)
  );

  // Generate personalized recommendations
  router.post('/digital-twin/:patientId/recommendations', (req, res) =>
    controller.generateRecommendations(req, res)
  );

  // Create what-if scenario
  router.post('/digital-twin/:patientId/what-if', (req, res) =>
    controller.createWhatIfScenario(req, res)
  );

  // Get health trajectory
  router.get('/digital-twin/:patientId/trajectory', (req, res) =>
    controller.getHealthTrajectory(req, res)
  );

  // Get risk factors
  router.get('/digital-twin/:patientId/risk-factors', (req, res) =>
    controller.getRiskFactors(req, res)
  );

  return router;
};
