/**
 * Recycling Report Service
 * Handles generation of compliance and environmental impact reports
 */

import recyclingRepository from '../repositories/RecyclingRepository';
import { RecyclingReport } from '../types/recycling';

export class RecyclingReportService {
  /**
   * Generate monthly report for a pharmacy
   */
  generateMonthlyReport(pharmacyId: string, month: string, year: number): RecyclingReport {
    return recyclingRepository.generateMonthlyReport(pharmacyId, month, year);
  }

  /**
   * Generate annual summary report for a pharmacy
   */
  generateAnnualReport(pharmacyId: string, year: number): {
    totalRequests: number;
    totalMedicationsCollected: number;
    totalQuantityCollected: number;
    totalWastePreventedKg: number;
    totalCarbonReduction: number;
    monthlyBreakdown: RecyclingReport[];
  } {
    const months = [
      '01', '02', '03', '04', '05', '06',
      '07', '08', '09', '10', '11', '12'
    ];

    const monthlyReports = months
      .map(month => recyclingRepository.generateMonthlyReport(pharmacyId, month, year))
      .filter(report => report.totalRequests > 0);

    const summary = {
      totalRequests: 0,
      totalMedicationsCollected: 0,
      totalQuantityCollected: 0,
      totalWastePreventedKg: 0,
      totalCarbonReduction: 0,
      monthlyBreakdown: monthlyReports,
    };

    monthlyReports.forEach(report => {
      summary.totalRequests += report.totalRequests;
      summary.totalMedicationsCollected += report.totalMedicationsCollected;
      summary.totalQuantityCollected += report.totalQuantityCollected;
      summary.totalWastePreventedKg += report.environmentalImpact.wastePreventedKg;
      summary.totalCarbonReduction += report.environmentalImpact.carbonFootprintReduction;
    });

    return summary;
  }

  /**
   * Generate compliance report (for regulatory purposes)
   */
  generateComplianceReport(pharmacyId: string, startDate: string, endDate: string): {
    pharmacyId: string;
    period: {
      start: string;
      end: string;
    };
    totalRequests: number;
    completionRate: number;
    averageProcessingTimeHours: number;
    expiredMedicationsHandled: number;
    complianceStatus: 'compliant' | 'warning' | 'non-compliant';
    details: any;
  } {
    const requests = recyclingRepository.findByPharmacyId(pharmacyId).filter(req => {
      const createdDate = new Date(req.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return createdDate >= start && createdDate <= end;
    });

    const processedRequests = requests.filter(r => r.status === 'processed');
    const completionRate = requests.length > 0 ? (processedRequests.length / requests.length) * 100 : 0;

    // Calculate average processing time
    let totalProcessingTime = 0;
    let processedCount = 0;

    processedRequests.forEach(req => {
      if (req.processedAt && req.requestedAt) {
        const start = new Date(req.requestedAt);
        const end = new Date(req.processedAt);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        totalProcessingTime += hours;
        processedCount++;
      }
    });

    const averageProcessingTimeHours = processedCount > 0 ? totalProcessingTime / processedCount : 0;

    // Count expired medications
    let expiredMedicationsHandled = 0;
    requests.forEach(req => {
      const expiredMeds = req.medications.filter(med => {
        const today = new Date().toISOString().split('T')[0];
        return med.expiryDate < today;
      });
      expiredMedicationsHandled += expiredMeds.length;
    });

    // Determine compliance status
    let complianceStatus: 'compliant' | 'warning' | 'non-compliant' = 'compliant';
    if (completionRate < 70) {
      complianceStatus = 'non-compliant';
    } else if (completionRate < 90) {
      complianceStatus = 'warning';
    }

    return {
      pharmacyId,
      period: {
        start: startDate,
        end: endDate,
      },
      totalRequests: requests.length,
      completionRate: Math.round(completionRate * 100) / 100,
      averageProcessingTimeHours: Math.round(averageProcessingTimeHours * 100) / 100,
      expiredMedicationsHandled,
      complianceStatus,
      details: {
        pending: requests.filter(r => r.status === 'pending').length,
        assigned: requests.filter(r => r.status === 'assigned').length,
        collected: requests.filter(r => r.status === 'collected').length,
        processed: processedRequests.length,
        cancelled: requests.filter(r => r.status === 'cancelled').length,
      },
    };
  }

  /**
   * Generate environmental impact summary
   */
  generateEnvironmentalImpactSummary(pharmacyId: string, year: number): {
    pharmacyId: string;
    year: number;
    wastePreventedKg: number;
    carbonFootprintReductionKg: number;
    equivalents: {
      treesPlanted: number;
      carsMilesCancelled: number;
      plasticBottlesSaved: number;
    };
  } {
    const annualReport = this.generateAnnualReport(pharmacyId, year);

    // Calculate equivalents
    // 1 tree absorbs ~20 kg CO2 per year
    const treesPlanted = Math.round(annualReport.totalCarbonReduction / 20);

    // 1 car produces ~0.21 kg CO2 per mile
    const carsMilesCancelled = Math.round(annualReport.totalCarbonReduction / 0.21);

    // Average plastic bottle is 0.025 kg, but we're comparing waste prevention
    // Assume 1 kg waste = 40 plastic bottles worth of environmental impact
    const plasticBottlesSaved = Math.round(annualReport.totalWastePreventedKg * 40);

    return {
      pharmacyId,
      year,
      wastePreventedKg: Math.round(annualReport.totalWastePreventedKg * 100) / 100,
      carbonFootprintReductionKg: Math.round(annualReport.totalCarbonReduction * 100) / 100,
      equivalents: {
        treesPlanted,
        carsMilesCancelled,
        plasticBottlesSaved,
      },
    };
  }

  /**
   * Generate summary for all pharmacies
   */
  generateNetworkSummary(month: string, year: number): {
    period: {
      month: string;
      year: number;
    };
    totalPharmacies: number;
    totalRequests: number;
    totalMedicationsCollected: number;
    totalQuantityCollected: number;
    networkWastePreventedKg: number;
    networkCarbonReductionKg: number;
    topPharmacies: Array<{
      pharmacyId: string;
      requests: number;
      wastePrevented: number;
    }>;
  } {
    const allRequests = recyclingRepository.findAll();

    // Filter by month and year
    const monthRequests = allRequests.filter(req => {
      if (req.status !== 'processed') return false;
      const createdDate = new Date(req.createdAt);
      return (
        createdDate.getMonth() === new Date(`${year}-${month}-01`).getMonth() &&
        createdDate.getFullYear() === year
      );
    });

    // Group by pharmacy
    const pharmacyStats = new Map<
      string,
      { requests: number; medications: number; quantity: number; waste: number }
    >();

    monthRequests.forEach(req => {
      const stats = pharmacyStats.get(req.pharmacyId) || {
        requests: 0,
        medications: 0,
        quantity: 0,
        waste: 0,
      };
      stats.requests += 1;
      stats.medications += req.medications.length;
      stats.quantity += req.medications.reduce((q, m) => q + m.quantity, 0);
      stats.waste = stats.quantity * 0.005;
      pharmacyStats.set(req.pharmacyId, stats);
    });

    // Calculate totals
    let totalMeds = 0;
    let totalQuantity = 0;
    let totalWaste = 0;

    pharmacyStats.forEach(stats => {
      totalMeds += stats.medications;
      totalQuantity += stats.quantity;
      totalWaste += stats.waste;
    });

    // Get top 5 pharmacies
    const topPharmacies = Array.from(pharmacyStats.entries())
      .sort((a, b) => b[1].requests - a[1].requests)
      .slice(0, 5)
      .map(([pharmacyId, stats]) => ({
        pharmacyId,
        requests: stats.requests,
        wastePrevented: Math.round(stats.waste * 100) / 100,
      }));

    return {
      period: {
        month,
        year,
      },
      totalPharmacies: pharmacyStats.size,
      totalRequests: monthRequests.length,
      totalMedicationsCollected: totalMeds,
      totalQuantityCollected: totalQuantity,
      networkWastePreventedKg: Math.round(totalWaste * 100) / 100,
      networkCarbonReductionKg: Math.round(totalWaste * 0.5 * 100) / 100,
      topPharmacies,
    };
  }
}

// Export singleton instance
export default new RecyclingReportService();
