/**
 * Adherence Controller
 * Handles HTTP requests for adherence tracking
 */

import { Request, Response } from 'express';
import { adherenceService } from '../services/AdherenceService';

export class AdherenceController {
  /**
   * GET /api/adherence/patient/:id
   * Get adherence summary for a patient (all medications)
   */
  async getPatientAdherence(req: Request, res: Response): Promise<void> {
    try {
      const { id: patientId } = req.params;

      if (!patientId) {
        res.status(400).json({ error: 'Patient ID is required' });
        return;
      }

      const metrics = adherenceService.getPatientAdherence(patientId);
      const summary = adherenceService.getPatientSummary(patientId);

      res.json({
        summary,
        medications: metrics
      });
    } catch (error) {
      console.error('Error getting patient adherence:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/adherence/patient/:id/medication/:medId
   * Get adherence for specific patient-medication pair
   */
  async getPatientMedicationAdherence(req: Request, res: Response): Promise<void> {
    try {
      const { id: patientId, medId: medicationId } = req.params;
      const { medicationName } = req.query;

      if (!patientId || !medicationId) {
        res.status(400).json({ error: 'Patient ID and Medication ID are required' });
        return;
      }

      const metrics = adherenceService.getPatientMedicationAdherence(
        patientId,
        medicationId,
        medicationName as string || `Medication ${medicationId}`
      );

      if (!metrics) {
        res.status(404).json({ error: 'No adherence data found' });
        return;
      }

      res.json(metrics);
    } catch (error) {
      console.error('Error getting patient medication adherence:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/adherence/patient/:id/history
   * Get adherence history over time
   */
  async getAdherenceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id: patientId } = req.params;
      const { medicationId, medicationName, months } = req.query;

      if (!patientId || !medicationId) {
        res.status(400).json({ error: 'Patient ID and Medication ID are required' });
        return;
      }

      const monthsNum = months ? parseInt(months as string, 10) : 6;
      const history = adherenceService.getAdherenceHistory(
        patientId,
        medicationId as string,
        medicationName as string || `Medication ${medicationId}`,
        monthsNum
      );

      res.json(history);
    } catch (error) {
      console.error('Error getting adherence history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/adherence/alerts/patient/:id
   * Get active adherence alerts for a patient
   */
  async getPatientAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { id: patientId } = req.params;

      if (!patientId) {
        res.status(400).json({ error: 'Patient ID is required' });
        return;
      }

      const alerts = adherenceService.getPatientAlerts(patientId);

      res.json(alerts);
    } catch (error) {
      console.error('Error getting patient alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/adherence/dispensation
   * Record a new medication dispensation
   */
  async recordDispensation(req: Request, res: Response): Promise<void> {
    try {
      const dispensation = req.body;

      // Validate required fields
      if (!dispensation.patientId || !dispensation.medicationId || !dispensation.dispensationDate) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      adherenceService.recordDispensation(dispensation);

      res.status(201).json({ message: 'Dispensation recorded successfully' });
    } catch (error) {
      console.error('Error recording dispensation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/adherence/doctor/patients/poor-adherence
   * Get patients with poor adherence (for doctor dashboard)
   */
  async getPatientsWithPoorAdherence(req: Request, res: Response): Promise<void> {
    try {
      const { patientIds } = req.query;

      if (!patientIds) {
        res.status(400).json({ error: 'Patient IDs are required' });
        return;
      }

      const patientIdArray = typeof patientIds === 'string'
        ? patientIds.split(',')
        : patientIds as string[];

      const results = adherenceService.getPatientsWithPoorAdherence(patientIdArray);

      res.json(results);
    } catch (error) {
      console.error('Error getting patients with poor adherence:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PATCH /api/adherence/alerts/:alertId/resolve
   * Resolve an adherence alert
   */
  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { patientId } = req.body;

      if (!alertId || !patientId) {
        res.status(400).json({ error: 'Alert ID and Patient ID are required' });
        return;
      }

      const resolved = adherenceService.resolveAlert(patientId, alertId);

      if (!resolved) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      res.json({ message: 'Alert resolved successfully' });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const adherenceController = new AdherenceController();
