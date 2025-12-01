/**
 * Refill Controller
 * HTTP request handlers for refill endpoints
 * Task: T2-107
 */

import { Request, Response } from 'express';
import { RefillService } from '../services/RefillService';
import { EligibilityService } from '../services/EligibilityService';
import {
  CreateRefillRequestDTO,
  ApproveRefillRequestDTO,
  DenyRefillRequestDTO,
  FillRefillRequestDTO,
} from '../types/refill.types';

export class RefillController {
  constructor(
    private refillService: RefillService,
    private eligibilityService: EligibilityService
  ) {}

  /**
   * POST /api/refills
   * Create a new refill request (patient action)
   */
  async createRefillRequest(req: Request, res: Response): Promise<void> {
    try {
      const { prescriptionId, patientId, pharmacyId, quantityRequested } =
        req.body;

      // Validate required fields
      if (!prescriptionId || !patientId || !pharmacyId) {
        res.status(400).json({
          error: 'Missing required fields: prescriptionId, patientId, pharmacyId',
        });
        return;
      }

      // Mock prescription data - in real implementation,
      // this would come from prescription service
      const prescription = {
        id: prescriptionId,
        patientId,
        pharmacyId,
        doctorId: 'doctor-123',
        medications: [
          {
            drugName: 'Aspirin',
            dosage: '500mg',
            quantity: 30,
            isControlledSubstance: false,
          },
        ],
        status: 'active',
        issuedAt: new Date('2024-01-01'),
        expiresAt: new Date('2025-12-31'),
        refillsAllowed: 11,
        refillsUsed: 2,
        lastRefillDate: new Date('2024-11-01'),
      };

      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const refillRequest = await this.refillService.createRefillRequest(
        {
          prescriptionId,
          patientId,
          pharmacyId,
          quantityRequested,
        },
        prescription,
        ipAddress,
        userAgent
      );

      res.status(201).json(refillRequest);
    } catch (error: any) {
      console.error('Error creating refill request:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/refills
   * Get refill requests for patient or pharmacy
   */
  async getRefillRequests(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, pharmacyId, status } = req.query;

      let refillRequests;

      if (patientId) {
        refillRequests = await this.refillService.getPatientRefills(
          patientId as string,
          status as any
        );
      } else if (pharmacyId) {
        if (status === 'pending') {
          refillRequests = await this.refillService.getPharmacyPendingRefills(
            pharmacyId as string
          );
        } else {
          res.status(400).json({
            error: 'Pharmacy can only query pending refills',
          });
          return;
        }
      } else {
        res.status(400).json({
          error: 'Must provide patientId or pharmacyId',
        });
        return;
      }

      res.json(refillRequests);
    } catch (error: any) {
      console.error('Error getting refill requests:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/refills/:id
   * Get specific refill request details
   */
  async getRefillRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const refillRequest = await this.refillService.getRefillRequest(id);

      if (!refillRequest) {
        res.status(404).json({ error: 'Refill request not found' });
        return;
      }

      res.json(refillRequest);
    } catch (error: any) {
      console.error('Error getting refill request:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/refills/:id/approve
   * Approve refill request (pharmacist action)
   */
  async approveRefill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { pharmacistId, notes } = req.body;

      if (!pharmacistId) {
        res.status(400).json({ error: 'pharmacistId is required' });
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress;

      const refillRequest = await this.refillService.approveRefill(
        {
          refillRequestId: id,
          pharmacistId,
          notes,
        },
        ipAddress
      );

      res.json(refillRequest);
    } catch (error: any) {
      console.error('Error approving refill:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/refills/:id/deny
   * Deny refill request with reason
   */
  async denyRefill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { pharmacistId, denialReason } = req.body;

      if (!pharmacistId || !denialReason) {
        res.status(400).json({
          error: 'pharmacistId and denialReason are required',
        });
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress;

      const refillRequest = await this.refillService.denyRefill(
        {
          refillRequestId: id,
          pharmacistId,
          denialReason,
        },
        ipAddress
      );

      res.json(refillRequest);
    } catch (error: any) {
      console.error('Error denying refill:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/refills/:id/fill
   * Mark refill as filled/dispensed
   */
  async fillRefill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { pharmacistId, quantityFilled, filledAt } = req.body;

      if (!pharmacistId || quantityFilled === undefined) {
        res.status(400).json({
          error: 'pharmacistId and quantityFilled are required',
        });
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress;

      const refillRequest = await this.refillService.fillRefill(
        {
          refillRequestId: id,
          pharmacistId,
          quantityFilled,
          filledAt,
        },
        ipAddress
      );

      res.json(refillRequest);
    } catch (error: any) {
      console.error('Error filling refill:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/refills/:prescriptionId/history
   * Get refill history for a prescription
   */
  async getRefillHistory(req: Request, res: Response): Promise<void> {
    try {
      const { prescriptionId } = req.params;
      const history = await this.refillService.getRefillHistory(prescriptionId);

      res.json(history);
    } catch (error: any) {
      console.error('Error getting refill history:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/prescriptions/:prescriptionId/eligibility
   * Check if prescription is eligible for refill
   */
  async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const { prescriptionId } = req.params;

      // Mock prescription data
      const prescription = {
        id: prescriptionId,
        patientId: 'patient-123',
        pharmacyId: 'pharmacy-123',
        doctorId: 'doctor-123',
        medications: [
          {
            drugName: 'Aspirin',
            dosage: '500mg',
            quantity: 30,
            isControlledSubstance: false,
          },
        ],
        status: 'active',
        issuedAt: new Date('2024-01-01'),
        expiresAt: new Date('2025-12-31'),
        refillsAllowed: 11,
        refillsUsed: 2,
        lastRefillDate: new Date('2024-11-01'),
      };

      const eligibility = await this.eligibilityService.checkEligibility(
        prescription
      );

      res.json(eligibility);
    } catch (error: any) {
      console.error('Error checking eligibility:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/refills/expire-old
   * Expire old refill requests (admin/scheduled task)
   */
  async expireOldRefills(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.refillService.expireOldRefillRequests();
      res.json({ message: `${count} refill requests expired` });
    } catch (error: any) {
      console.error('Error expiring refills:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
