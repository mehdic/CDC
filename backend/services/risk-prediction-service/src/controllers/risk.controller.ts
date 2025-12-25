/**
 * Risk Prediction Controller
 * HTTP request handlers for risk prediction API
 */

import type { Request, Response } from 'express';
import { RiskPredictionService } from '../services/risk-prediction.service';
import type { PatientData, AssessRiskRequest } from '../types/risk.types';
import { z } from 'zod';

// Request validation schemas
const AssessRiskSchema = z.object({
  patientId: z.string().min(1),
  includeProjection: z.boolean().optional(),
});

const AcknowledgeAlertSchema = z.object({
  alertId: z.string().min(1),
  userId: z.string().min(1),
});

export class RiskController {
  private readonly riskService: RiskPredictionService;

  constructor(riskService: RiskPredictionService) {
    this.riskService = riskService;
  }

  /**
   * POST /api/risk-prediction/assess
   * Assess patient risk
   */
  public assessRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const validatedData = AssessRiskSchema.parse(req.body);

      // In a real implementation, this would fetch from database
      // For MVP, we'll use mock patient data from the request
      const patientData = req.body.patientData as PatientData;
      const patientName = req.body.patientName as string;

      if (!patientData || !patientName) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'patientData and patientName are required',
        });
        return;
      }

      const request: AssessRiskRequest = {
        patientId: validatedData.patientId,
        includeProjection: validatedData.includeProjection,
      };

      const result = await this.riskService.assessPatientRisk(
        request,
        patientData,
        patientName
      );

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          details: error.errors,
        });
        return;
      }

      console.error('Error assessing risk:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to assess patient risk',
      });
    }
  };

  /**
   * GET /api/risk-prediction/patient/:id
   * Get patient risk history
   */
  public getPatientHistory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Patient ID is required',
        });
        return;
      }

      const history = this.riskService.getPatientHistory(id);

      res.status(200).json({
        patientId: id,
        assessments: history,
        count: history.length,
      });
    } catch (error) {
      console.error('Error fetching patient history:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch patient history',
      });
    }
  };

  /**
   * GET /api/risk-prediction/alerts
   * Get all active alerts
   */
  public getActiveAlerts = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const alerts = this.riskService.getActiveAlerts();

      res.status(200).json({
        alerts,
        count: alerts.length,
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch alerts',
      });
    }
  };

  /**
   * GET /api/risk-prediction/alerts/patient/:id
   * Get alerts for a specific patient
   */
  public getPatientAlerts = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Patient ID is required',
        });
        return;
      }

      const alerts = this.riskService.getPatientAlerts(id);

      res.status(200).json({
        patientId: id,
        alerts,
        count: alerts.length,
      });
    } catch (error) {
      console.error('Error fetching patient alerts:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch patient alerts',
      });
    }
  };

  /**
   * POST /api/risk-prediction/alerts/:id/acknowledge
   * Acknowledge an alert
   */
  public acknowledgeAlert = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = AcknowledgeAlertSchema.parse({
        alertId: id,
        userId: req.body.userId,
      });

      const alert = this.riskService.acknowledgeAlert(
        validatedData.alertId,
        validatedData.userId
      );

      if (!alert) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Alert not found',
        });
        return;
      }

      res.status(200).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          details: error.errors,
        });
        return;
      }

      console.error('Error acknowledging alert:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to acknowledge alert',
      });
    }
  };

  /**
   * GET /api/risk-prediction/trends/:id
   * Get risk trends for a patient
   */
  public getPatientTrends = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Patient ID is required',
        });
        return;
      }

      const trends = this.riskService.getPatientTrends(id);

      res.status(200).json({
        patientId: id,
        trends,
        count: trends.length,
      });
    } catch (error) {
      console.error('Error fetching patient trends:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch patient trends',
      });
    }
  };
}
