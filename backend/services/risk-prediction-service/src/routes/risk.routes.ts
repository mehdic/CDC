/**
 * Risk Prediction Routes
 * API route definitions
 */

import { Router } from 'express';
import { RiskController } from '../controllers/risk.controller';
import { RiskPredictionService } from '../services/risk-prediction.service';

export function createRiskRoutes(): Router {
  const router = Router();
  const riskService = new RiskPredictionService();
  const controller = new RiskController(riskService);

  // Risk assessment
  router.post('/assess', controller.assessRisk);

  // Patient history
  router.get('/patient/:id', controller.getPatientHistory);

  // Alerts
  router.get('/alerts', controller.getActiveAlerts);
  router.get('/alerts/patient/:id', controller.getPatientAlerts);
  router.post('/alerts/:id/acknowledge', controller.acknowledgeAlert);

  // Trends
  router.get('/trends/:id', controller.getPatientTrends);

  return router;
}
