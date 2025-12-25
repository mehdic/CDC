/**
 * Renewal Controller
 * REST API endpoints for prescription renewal predictions
 * Task: T8-055
 */

import { Request, Response, NextFunction } from 'express';
import { RenewalPredictionService, CreatePredictionRequest, UpdatePredictionRequest } from '../services/RenewalPredictionService';
import { RenewalSchedulerService, CreateReminderRequest } from '../services/RenewalSchedulerService';
import { DataSource } from 'typeorm';

export class RenewalController {
  private predictionService: RenewalPredictionService;
  private schedulerService: RenewalSchedulerService;

  constructor(dataSource: DataSource) {
    this.predictionService = new RenewalPredictionService(dataSource);
    this.schedulerService = new RenewalSchedulerService(dataSource);
  }

  /**
   * POST /api/renewals/predictions
   * Generate a new renewal prediction
   */
  createPrediction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request: CreatePredictionRequest = req.body;

      const prediction = await this.predictionService.generatePrediction(request);

      res.status(201).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/renewals/predictions/:id
   * Get a specific prediction by ID
   */
  getPrediction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const prediction = await this.predictionService.getPredictionById(id);

      if (!prediction) {
        res.status(404).json({
          success: false,
          error: 'Prediction not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/renewals/predictions/patient/:patientId
   * Get all predictions for a patient
   */
  getPatientPredictions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;

      const predictions = await this.predictionService.getPredictionsForPatient(patientId);

      res.status(200).json({
        success: true,
        data: predictions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/renewals/predictions/pharmacy/:pharmacyId/pending
   * Get pending predictions for a pharmacy
   */
  getPharmacyPendingPredictions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { pharmacyId } = req.params;

      const predictions = await this.predictionService.getPendingPredictionsForPharmacy(pharmacyId);

      res.status(200).json({
        success: true,
        data: predictions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/renewals/predictions/attention
   * Get predictions requiring attention (expiring soon)
   */
  getAttentionPredictions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const predictions = await this.predictionService.getPredictionsRequiringAttention();

      res.status(200).json({
        success: true,
        data: predictions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/renewals/predictions/:id
   * Update prediction status (approve/reject)
   */
  updatePrediction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const update: UpdatePredictionRequest = req.body;

      const prediction = await this.predictionService.updatePrediction(id, update);

      // If approved, automatically schedule reminders
      if (update.status === 'approved') {
        await this.schedulerService.scheduleRemindersForPrediction(id);
      }

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/renewals/predictions/:id/approve
   * Approve a prediction and schedule reminders
   */
  approvePrediction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, notes } = req.body;

      // Approve prediction
      const prediction = await this.predictionService.updatePrediction(id, {
        status: 'approved',
        approvedBy,
        notes,
      });

      // Schedule reminders
      const reminders = await this.schedulerService.scheduleRemindersForPrediction(id);

      res.status(200).json({
        success: true,
        data: {
          prediction,
          reminders,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/renewals/predictions/:id/reject
   * Reject a prediction
   */
  rejectPrediction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, notes } = req.body;

      const prediction = await this.predictionService.updatePrediction(id, {
        status: 'rejected',
        approvedBy,
        notes,
      });

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/renewals/reminders/patient/:patientId
   * Get reminders for a patient
   */
  getPatientReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;

      const reminders = await this.schedulerService.getRemindersForPatient(patientId);

      res.status(200).json({
        success: true,
        data: reminders,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/renewals/reminders
   * Create a manual reminder
   */
  createReminder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request: CreateReminderRequest = req.body;

      const reminder = await this.schedulerService.createReminder(request);

      res.status(201).json({
        success: true,
        data: reminder,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/renewals/reminders/process
   * Process all due reminders (admin/cron endpoint)
   */
  processDueReminders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.schedulerService.processDueReminders();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/renewals/reminders/:id
   * Cancel a scheduled reminder
   */
  cancelReminder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const reminder = await this.schedulerService.cancelReminder(id);

      res.status(200).json({
        success: true,
        data: reminder,
      });
    } catch (error) {
      next(error);
    }
  };
}
