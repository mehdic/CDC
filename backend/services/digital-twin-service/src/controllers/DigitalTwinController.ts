/**
 * Digital Twin Controller
 * HTTP request handlers for digital twin endpoints
 */

import { Request, Response } from 'express';
import { DigitalTwinService } from '../services/DigitalTwinService';

export class DigitalTwinController {
  constructor(private digitalTwinService: DigitalTwinService) {}

  /**
   * GET /api/digital-twin/:patientId
   * Get digital twin for a patient
   */
  async getDigitalTwin(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      const twin = await this.digitalTwinService.getByPatientId(patientId);

      if (!twin) {
        res.status(404).json({
          error: 'Not Found',
          message: `Digital twin not found for patient ${patientId}`,
        });
        return;
      }

      res.json({
        success: true,
        data: twin,
      });
    } catch (error: any) {
      console.error('Error fetching digital twin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/digital-twin
   * Create a new digital twin
   */
  async createDigitalTwin(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, age, gender, ethnicity, aiAnalysisConsent, dataSharingConsent } = req.body;

      if (!patientId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'patientId is required',
        });
        return;
      }

      const twin = await this.digitalTwinService.createDigitalTwin({
        patientId,
        age,
        gender,
        ethnicity,
        aiAnalysisConsent,
        dataSharingConsent,
      });

      res.status(201).json({
        success: true,
        message: 'Digital twin created successfully',
        data: twin,
      });
    } catch (error: any) {
      console.error('Error creating digital twin:', error);

      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/digital-twin/:patientId
   * Update digital twin data
   */
  async updateDigitalTwin(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const updateData = req.body;
      const updatedBy = req.body.updatedBy; // Would come from auth middleware

      const twin = await this.digitalTwinService.updateDigitalTwin(patientId, updateData, updatedBy);

      res.json({
        success: true,
        message: 'Digital twin updated successfully',
        data: twin,
      });
    } catch (error: any) {
      console.error('Error updating digital twin:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/digital-twin/:patientId/recalculate
   * Recalculate health scores
   */
  async recalculateScores(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      const twin = await this.digitalTwinService.getByPatientId(patientId);

      if (!twin) {
        res.status(404).json({
          error: 'Not Found',
          message: `Digital twin not found for patient ${patientId}`,
        });
        return;
      }

      const scores = await this.digitalTwinService.recalculateHealthScores(twin.id);

      res.json({
        success: true,
        message: 'Health scores recalculated successfully',
        data: scores,
      });
    } catch (error: any) {
      console.error('Error recalculating scores:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/digital-twin/:patientId/recommendations
   * Generate personalized recommendations
   */
  async generateRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      const twin = await this.digitalTwinService.generateRecommendations(patientId);

      res.json({
        success: true,
        message: 'Recommendations generated successfully',
        data: {
          recommendations: twin.recommendations,
          count: twin.recommendations.length,
        },
      });
    } catch (error: any) {
      console.error('Error generating recommendations:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/digital-twin/:patientId/what-if
   * Create a what-if scenario
   */
  async createWhatIfScenario(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { scenario, description } = req.body;

      if (!scenario || !description) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'scenario and description are required',
        });
        return;
      }

      const whatIfScenario = await this.digitalTwinService.createWhatIfScenario(
        patientId,
        scenario,
        description
      );

      res.status(201).json({
        success: true,
        message: 'What-if scenario created successfully',
        data: whatIfScenario,
      });
    } catch (error: any) {
      console.error('Error creating what-if scenario:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/digital-twin/:patientId/trajectory
   * Get health trajectory
   */
  async getHealthTrajectory(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      const twin = await this.digitalTwinService.getByPatientId(patientId);

      if (!twin) {
        res.status(404).json({
          error: 'Not Found',
          message: `Digital twin not found for patient ${patientId}`,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          trajectory: twin.healthTrajectory,
          currentScore: twin.overallHealthScore,
          currentRiskLevel: twin.currentRiskLevel,
        },
      });
    } catch (error: any) {
      console.error('Error fetching health trajectory:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/digital-twin/:patientId/risk-factors
   * Get identified risk factors
   */
  async getRiskFactors(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      const twin = await this.digitalTwinService.getByPatientId(patientId);

      if (!twin) {
        res.status(404).json({
          error: 'Not Found',
          message: `Digital twin not found for patient ${patientId}`,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          riskFactors: twin.riskFactors,
          currentRiskLevel: twin.currentRiskLevel,
          riskScores: {
            cardiovascular: twin.cardiovascularRisk,
            diabetes: twin.diabetesRisk,
            hospitalReadmission: twin.hospitalReadmissionRisk,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching risk factors:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
}
