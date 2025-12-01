/**
 * Insurance Service Tests
 * Unit tests for insurance business logic
 */

import { InsuranceService } from '../services/insurance.service';
import { ClaimsService } from '../services/claims.service';
import { CoverageService } from '../services/coverage.service';
import { PatientInsurance } from '../entities/PatientInsurance';
import { InsuranceClaim } from '../entities/InsuranceClaim';
import { CoverageDetails } from '../entities/CoverageDetails';

describe('InsuranceService', () => {
  // ============================================================================
  // Default Providers Tests
  // ============================================================================

  describe('getDefaultProviders', () => {
    it('should return list of default Swiss insurance providers', () => {
      const providers = InsuranceService.getDefaultProviders();
      expect(providers).toHaveLength(4);
      expect(providers[0].code).toBe('CSS');
      expect(providers[1].code).toBe('HELSANA');
      expect(providers[2].code).toBe('SWICA');
      expect(providers[3].code).toBe('AXA');
    });

    it('should have all providers as active', () => {
      const providers = InsuranceService.getDefaultProviders();
      providers.forEach((provider) => {
        expect(provider.isActive).toBe(true);
      });
    });

    it('should all be LAMal type insurance', () => {
      const providers = InsuranceService.getDefaultProviders();
      providers.forEach((provider) => {
        expect(provider.insuranceType).toBe('LAMal');
      });
    });
  });

  describe('getSwissConfig', () => {
    it('should return Swiss insurance configuration', () => {
      const config = InsuranceService.getSwissConfig();
      expect(config).toBeDefined();
      expect(config.defaultQuotePartPercentage).toBe(10);
      expect(config.minFranchise).toBe(300);
      expect(config.maxFranchise).toBe(2500);
    });

    it('should include all default providers', () => {
      const config = InsuranceService.getSwissConfig();
      expect(config.insuranceProviders).toHaveLength(4);
    });
  });

  // ============================================================================
  // Coverage Verification Tests
  // ============================================================================

  describe('verifyCoverage', () => {
    let patientInsurance: PatientInsurance;

    beforeEach(() => {
      patientInsurance = new PatientInsurance();
      patientInsurance.patientId = 'patient-123';
      patientInsurance.insuranceProviderId = 'provider-css';
      patientInsurance.franchiseLevel = 1000;
      patientInsurance.currentFranchiseSpent = 300;
      patientInsurance.quotePartPercentage = 10;
    });

    it('should calculate correct reimbursement with franchise deduction', () => {
      const response = InsuranceService.verifyCoverage(patientInsurance, 500);

      expect(response.isEligible).toBe(true);
      expect(response.remainingFranchise).toBe(700);
      // Remaining franchise (200) is less than claim (500)
      // So: franchiseDeduction = 200, amountAfterFranchise = 300
      // quotePartAmount = 30 (10% of 300), reimbursableAmount = 270
      // Since all franchise is deducted, estimatedReimbursement = 0 (franchise covers it)
      expect(response.estimatedReimbursement).toBeCloseTo(0);
    });

    it('should handle full franchise coverage', () => {
      patientInsurance.currentFranchiseSpent = 0;
      const response = InsuranceService.verifyCoverage(patientInsurance, 1000);

      expect(response.remainingFranchise).toBe(1000);
      // After franchise: 0, quote-part: 0, reimbursement: 0
      expect(response.estimatedReimbursement).toBe(0);
    });

    it('should handle amount greater than remaining franchise', () => {
      patientInsurance.currentFranchiseSpent = 800;
      const response = InsuranceService.verifyCoverage(patientInsurance, 500);

      expect(response.remainingFranchise).toBe(200);
      // Franchise deduction: 200, amount after: 300, quote-part: 30, reimbursement: 270
      expect(response.estimatedReimbursement).toBeCloseTo(270);
    });
  });

  // ============================================================================
  // Claim Calculation Tests
  // ============================================================================

  describe('calculateClaimAmounts', () => {
    let patientInsurance: PatientInsurance;

    beforeEach(() => {
      patientInsurance = new PatientInsurance();
      patientInsurance.franchiseLevel = 1000;
      patientInsurance.currentFranchiseSpent = 300;
      patientInsurance.quotePartPercentage = 10;
    });

    it('should correctly split claim into franchise, quote-part, and reimbursable', () => {
      const amounts = InsuranceService.calculateClaimAmounts(500, patientInsurance);

      // Remaining franchise is 700 (1000 - 300 spent), so all 500 goes to franchise
      expect(amounts.franchiseDeduction).toBe(500); // All amount covers remaining franchise
      expect(amounts.quotePartAmount).toBe(0); // 10% of 0 (all covered by franchise)
      expect(amounts.reimbursableAmount).toBe(0); // 0 - 0
    });

    it('should handle zero remaining franchise', () => {
      patientInsurance.currentFranchiseSpent = 1000;
      const amounts = InsuranceService.calculateClaimAmounts(100, patientInsurance);

      expect(amounts.franchiseDeduction).toBe(0);
      expect(amounts.quotePartAmount).toBe(10); // 10% of 100
      expect(amounts.reimbursableAmount).toBe(90);
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe('validation methods', () => {
    it('should validate franchise levels', () => {
      expect(InsuranceService.isValidFranchiseLevel(300)).toBe(true);
      expect(InsuranceService.isValidFranchiseLevel(1000)).toBe(true);
      expect(InsuranceService.isValidFranchiseLevel(2500)).toBe(true);
      expect(InsuranceService.isValidFranchiseLevel(400)).toBe(false);
      expect(InsuranceService.isValidFranchiseLevel(3000)).toBe(false);
    });

    it('should validate insurance types', () => {
      expect(InsuranceService.isValidInsuranceType('LAMal')).toBe(true);
      expect(InsuranceService.isValidInsuranceType('LCA')).toBe(true);
      expect(InsuranceService.isValidInsuranceType('PRIVATE')).toBe(true);
      expect(InsuranceService.isValidInsuranceType('INVALID')).toBe(false);
    });

    it('should validate coverage types', () => {
      expect(InsuranceService.isValidCoverageType('basic')).toBe(true);
      expect(InsuranceService.isValidCoverageType('complementary')).toBe(true);
      expect(InsuranceService.isValidCoverageType('dental')).toBe(true);
      expect(InsuranceService.isValidCoverageType('accident')).toBe(true);
      expect(InsuranceService.isValidCoverageType('invalid')).toBe(false);
    });

    it('should validate claim statuses', () => {
      expect(InsuranceService.isValidClaimStatus('draft')).toBe(true);
      expect(InsuranceService.isValidClaimStatus('submitted')).toBe(true);
      expect(InsuranceService.isValidClaimStatus('approved')).toBe(true);
      expect(InsuranceService.isValidClaimStatus('paid')).toBe(true);
      expect(InsuranceService.isValidClaimStatus('invalid')).toBe(false);
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('calculateStatistics', () => {
    it('should calculate claim statistics', () => {
      const claims: InsuranceClaim[] = [];

      for (let i = 0; i < 5; i++) {
        const claim = new InsuranceClaim();
        claim.patientId = `patient-${i}`;
        claim.amount = 100 + i * 10;
        claim.reimbursableAmount = 80 + i * 8;
        claim.status = i < 2 ? 'paid' : 'submitted';
        claims.push(claim);
      }

      const stats = InsuranceService.calculateStatistics(claims);

      expect(stats.totalPatients).toBe(5);
      expect(stats.activeClaims).toBe(3);
      expect(stats.totalReimbursed).toBeCloseTo(80 + 88);
      // Total amounts: 100, 110, 120, 130, 140 = 600 / 5 = 120
      expect(stats.avgClaimAmount).toBeCloseTo(120);
    });

    it('should handle empty claims list', () => {
      const stats = InsuranceService.calculateStatistics([]);

      expect(stats.totalPatients).toBe(0);
      expect(stats.activeClaims).toBe(0);
      expect(stats.avgClaimAmount).toBe(0);
    });
  });
});

describe('ClaimsService', () => {
  // ============================================================================
  // Claim Creation Tests
  // ============================================================================

  describe('createClaimFromRequest', () => {
    let patientInsurance: PatientInsurance;

    beforeEach(() => {
      patientInsurance = new PatientInsurance();
      patientInsurance.id = 'patient-insurance-123';
      patientInsurance.franchiseLevel = 1000;
      patientInsurance.currentFranchiseSpent = 300;
      patientInsurance.quotePartPercentage = 10;
    });

    it('should create claim with calculated amounts', () => {
      const request = {
        patientInsuranceId: 'patient-insurance-123',
        amount: 500,
      };

      const claim = ClaimsService.createClaimFromRequest(request, 'patient-123', patientInsurance);

      expect(claim.patientId).toBe('patient-123');
      expect(claim.amount).toBe(500);
      expect(claim.status).toBe('draft');
      // Remaining franchise is 700 (1000 - 300 spent), so all 500 goes to franchise
      expect(claim.franchiseDeduction).toBe(500);
      expect(claim.quotePartAmount).toBeCloseTo(0);
      expect(claim.reimbursableAmount).toBeCloseTo(0);
    });

    it('should set claim date to today', () => {
      const request = { patientInsuranceId: 'pi-123', amount: 100 };
      const claim = ClaimsService.createClaimFromRequest(request, 'p-123', patientInsurance);

      expect(claim.claimDate).toBeDefined();
      const timeDiff = Math.abs(claim.claimDate.getTime() - new Date().getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('prepareClaim', () => {
    it('should change status to submitted and add reference', () => {
      const claim = new InsuranceClaim();
      claim.id = 'claim-123';
      claim.status = 'draft';

      const prepared = ClaimsService.prepareClaim(claim);

      expect(prepared.status).toBe('submitted');
      expect(prepared.submissionDate).toBeDefined();
      expect(prepared.reference).toBeDefined();
      expect(prepared.reference).toMatch(/^CLAIM-\d+-/);
    });
  });

  describe('validateClaimForSubmission', () => {
    let claim: InsuranceClaim;

    beforeEach(() => {
      claim = new InsuranceClaim();
      claim.patientId = 'p-123';
      claim.patientInsuranceId = 'pi-123';
      claim.amount = 100;
      claim.claimDate = new Date();
      claim.status = 'draft';
      claim.reimbursableAmount = 80;
    });

    it('should validate valid claim', () => {
      const result = ClaimsService.validateClaimForSubmission(claim);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject claim with no patient ID', () => {
      claim.patientId = '';
      const result = ClaimsService.validateClaimForSubmission(claim);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Patient ID is required');
    });

    it('should reject claim with non-draft status', () => {
      claim.status = 'submitted';
      const result = ClaimsService.validateClaimForSubmission(claim);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Only draft claims can be submitted');
    });
  });

  describe('getSummary', () => {
    it('should calculate claim summary correctly', () => {
      const claims: InsuranceClaim[] = [];

      // Create 5 claims with different statuses
      const statuses = ['submitted', 'submitted', 'approved', 'paid', 'rejected'];
      statuses.forEach((status, i) => {
        const claim = new InsuranceClaim();
        claim.id = `claim-${i}`;
        claim.amount = 100;
        claim.status = status;
        claim.franchiseDeduction = 10;
        claim.quotePartAmount = 10;
        claim.reimbursableAmount = 80;
        claims.push(claim);
      });

      const summary = ClaimsService.getSummary(claims);

      expect(summary.total).toBe(5);
      expect(summary.submitted).toBe(2);
      expect(summary.approved).toBe(1);
      expect(summary.paid).toBe(1);
      expect(summary.rejected).toBe(1);
      expect(summary.totalAmount).toBe(500);
      expect(summary.totalFranchise).toBe(50);
      expect(summary.totalQuotePart).toBe(50);
    });
  });
});

describe('CoverageService', () => {
  // ============================================================================
  // Coverage Creation Tests
  // ============================================================================

  describe('createCoverageDetails', () => {
    it('should create coverage details with defaults', () => {
      const coverage = CoverageService.createCoverageDetails('pi-123', 'basic');

      expect(coverage.patientInsuranceId).toBe('pi-123');
      expect(coverage.coverageType).toBe('basic');
      expect(coverage.isApproved).toBe(true);
      expect(coverage.maxReimbursementPercentage).toBe(100);
      expect(coverage.currentYearSpent).toBe(0);
      expect(coverage.yearStart).toBeDefined();
      expect(coverage.yearEnd).toBeDefined();
    });
  });

  describe('getRemainingAnnualLimit', () => {
    it('should calculate remaining annual limit', () => {
      const coverage = new CoverageDetails();
      coverage.annualLimit = 5000;
      coverage.currentYearSpent = 2000;

      const remaining = CoverageService.getRemainingAnnualLimit(coverage);
      expect(remaining).toBe(3000);
    });

    it('should return infinity when no limit is set', () => {
      const coverage = new CoverageDetails();
      coverage.annualLimit = undefined as any;

      const remaining = CoverageService.getRemainingAnnualLimit(coverage);
      expect(remaining).toBe(Infinity);
    });

    it('should return zero when limit exceeded', () => {
      const coverage = new CoverageDetails();
      coverage.annualLimit = 5000;
      coverage.currentYearSpent = 6000;

      const remaining = CoverageService.getRemainingAnnualLimit(coverage);
      expect(remaining).toBe(0);
    });
  });

  describe('validateCoverageDetails', () => {
    let coverage: CoverageDetails;

    beforeEach(() => {
      coverage = new CoverageDetails();
      coverage.patientInsuranceId = 'pi-123';
      coverage.coverageType = 'basic';
      coverage.maxReimbursementPercentage = 100;
      coverage.currentYearSpent = 0;
    });

    it('should validate correct coverage details', () => {
      const result = CoverageService.validateCoverageDetails(coverage);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid reimbursement percentage', () => {
      coverage.maxReimbursementPercentage = 150;
      const result = CoverageService.validateCoverageDetails(coverage);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Reimbursement percentage must be between 0 and 100');
    });

    it('should reject negative year spent', () => {
      coverage.currentYearSpent = -100;
      const result = CoverageService.validateCoverageDetails(coverage);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Year spent amount cannot be negative');
    });
  });
});
