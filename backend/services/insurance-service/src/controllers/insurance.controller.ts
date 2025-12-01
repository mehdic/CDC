/**
 * Insurance Controller
 * Handles HTTP requests for insurance endpoints
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { InsuranceProvider } from '../entities/InsuranceProvider';
import { PatientInsurance } from '../entities/PatientInsurance';
import { InsuranceClaim } from '../entities/InsuranceClaim';
import { CoverageDetails } from '../entities/CoverageDetails';
import { ThirdPartyPayment } from '../entities/ThirdPartyPayment';
import { InsuranceService } from '../services/insurance.service';
import { ClaimsService } from '../services/claims.service';
import { CoverageService } from '../services/coverage.service';

export class InsuranceController {
  /**
   * GET /api/insurance/providers
   * List all available insurance providers
   */
  static async listProviders(req: Request, res: Response): Promise<void> {
    try {
      const providerRepository = AppDataSource.getRepository(InsuranceProvider);
      const providers = await providerRepository.find({
        where: { isActive: true },
      });

      res.status(200).json({
        success: true,
        data: providers,
        count: providers.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: 'Failed to list insurance providers',
        message: errorMessage,
      });
    }
  }

  /**
   * GET /api/insurance/providers/:id
   * Get specific insurance provider details
   */
  static async getProvider(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const providerRepository = AppDataSource.getRepository(InsuranceProvider);
      const provider = await providerRepository.findOne({
        where: { id },
      });

      if (!provider) {
        res.status(404).json({
          success: false,
          error: 'Insurance provider not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: provider,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: 'Failed to get insurance provider',
        message: errorMessage,
      });
    }
  }

  /**
   * POST /api/insurance/verify
   * Verify patient insurance coverage
   */
  static async verifyCoverage(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, insuranceProviderId, amount } = req.body;

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required',
        });
        return;
      }

      const patientInsuranceRepository = AppDataSource.getRepository(PatientInsurance);
      const patientInsurance = await patientInsuranceRepository.findOne({
        where: {
          patientId,
          insuranceProviderId: insuranceProviderId || undefined,
          isActive: true,
        },
      });

      const verificationResponse = CoverageService.verifyCoverage(
        { patientId, insuranceProviderId },
        patientInsurance,
        amount || 0
      );

      res.status(200).json({
        success: true,
        data: verificationResponse,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: 'Failed to verify coverage',
        message: errorMessage,
      });
    }
  }

  /**
   * POST /api/insurance/claims
   * Submit a new insurance claim
   */
  static async submitClaim(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, patientInsuranceId, prescriptionId, amount, description, attachments } =
        req.body;

      // Validation
      if (!patientId || !patientInsuranceId || !amount) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: patientId, patientInsuranceId, amount',
        });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0',
        });
        return;
      }

      // Get patient insurance to calculate amounts
      const patientInsuranceRepository = AppDataSource.getRepository(PatientInsurance);
      const patientInsurance = await patientInsuranceRepository.findOne({
        where: { id: patientInsuranceId },
      });

      if (!patientInsurance) {
        res.status(404).json({
          success: false,
          error: 'Patient insurance not found',
        });
        return;
      }

      // Create claim
      const claim = ClaimsService.createClaimFromRequest(
        {
          patientInsuranceId,
          prescriptionId,
          amount,
          description,
          attachments,
        },
        patientId,
        patientInsurance
      );

      // Save claim
      const claimRepository = AppDataSource.getRepository(InsuranceClaim);
      const savedClaim = await claimRepository.save(claim);

      res.status(201).json({
        success: true,
        data: savedClaim,
        message: 'Claim submitted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: 'Failed to submit claim',
        message: errorMessage,
      });
    }
  }

  /**
   * GET /api/insurance/claims/:id
   * Get claim status
   */
  static async getClaimStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const claimRepository = AppDataSource.getRepository(InsuranceClaim);
      const claim = await claimRepository.findOne({
        where: { id },
      });

      if (!claim) {
        res.status(404).json({
          success: false,
          error: 'Claim not found',
        });
        return;
      }

      const status = ClaimsService.getClaimStatus(claim);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: 'Failed to get claim status',
        message: errorMessage,
      });
    }
  }

  /**
   * GET /api/insurance/claims
   * List patient's claims
   */
  static async listClaims(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, status, limit = '20', offset = '0' } = req.query;

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required',
        });
        return;
      }

      const claimRepository = AppDataSource.getRepository(InsuranceClaim);
      const query = claimRepository
        .createQueryBuilder('claim')
        .where('claim.patientId = :patientId', { patientId });

      if (status) {
        query.andWhere('claim.status = :status', { status });
      }

      const claims = await query
        .orderBy('claim.claimDate', 'DESC')
        .limit(Number(limit))
        .offset(Number(offset))
        .getMany();

      const total = await query.getCount();

      res.status(200).json({
        success: true,
        data: claims,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: 'Failed to list claims',
        message: errorMessage,
      });
    }
  }

  /**
   * GET /api/insurance/statistics
   * Get insurance statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const claimRepository = AppDataSource.getRepository(InsuranceClaim);
      const allClaims = await claimRepository.find();

      const statistics = InsuranceService.calculateStatistics(allClaims);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics',
        message: errorMessage,
      });
    }
  }
}
