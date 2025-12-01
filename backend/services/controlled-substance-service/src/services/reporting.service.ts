import { Repository } from 'typeorm';
import {
  ComplianceReport,
  SwissmedecReportingData,
  DrugSchedule,
} from '../types/controlled.types';
import { DispensationLog } from '../entities/DispensationLog';
import { ControlledSubstance } from '../entities/ControlledSubstance';
import { Alert } from '../entities/Alert';

/**
 * Reporting Service
 * Generates compliance reports for Swiss Swissmedic regulations
 */
export class ReportingService {
  constructor(
    private dispensationRepository: Repository<DispensationLog>,
    private substanceRepository: Repository<ControlledSubstance>,
    private alertRepository: Repository<Alert>
  ) {}

  /**
   * Generates compliance report for a pharmacy
   */
  async generatePharmacyComplianceReport(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    // Get all dispensations in period
    const dispensations = await this.dispensationRepository.find({
      where: {
        pharmacyId,
      },
      order: { dispensedDate: 'DESC' },
    });

    const periodDispensations = dispensations.filter(
      (d) => d.dispensedDate >= startDate && d.dispensedDate <= endDate
    );

    // Group by substance
    const substanceMap = new Map<
      string,
      {
        substance: ControlledSubstance;
        count: number;
        totalQuantity: number;
      }
    >();

    for (const disp of periodDispensations) {
      const substance = await this.substanceRepository.findOne({
        where: { id: disp.substanceId },
      });

      if (!substance) continue;

      if (!substanceMap.has(disp.substanceId)) {
        substanceMap.set(disp.substanceId, {
          substance,
          count: 0,
          totalQuantity: 0,
        });
      }

      const entry = substanceMap.get(disp.substanceId)!;
      entry.count += 1;
      entry.totalQuantity += disp.quantityDispensed;
    }

    // Get flagged patients
    const alerts = await this.alertRepository.find({
      where: { pharmacyId },
      order: { createdAt: 'DESC' },
    });

    const patientAlertsMap = new Map<
      string,
      {
        alertCount: number;
        alerts: Alert[];
      }
    >();

    for (const alert of alerts) {
      if (!patientAlertsMap.has(alert.patientId)) {
        patientAlertsMap.set(alert.patientId, {
          alertCount: 0,
          alerts: [],
        });
      }

      const entry = patientAlertsMap.get(alert.patientId)!;
      if (!alert.resolvedAt) {
        entry.alertCount += 1;
      }
      entry.alerts.push(alert);
    }

    // Identify compliance issues
    const complianceIssues: string[] = [];

    const unresolvedAlerts = alerts.filter((a) => !a.resolvedAt);
    if (unresolvedAlerts.length > 0) {
      complianceIssues.push(`${unresolvedAlerts.length} unresolved alerts`);
    }

    // Check for substances without proper documentation
    for (const [substanceId, data] of substanceMap.entries()) {
      if (data.substance.requiresSpecialForm) {
        const withoutForm = periodDispensations.filter(
          (d) => d.substanceId === substanceId && !d.specialFormNumber
        ).length;

        if (withoutForm > 0) {
          complianceIssues.push(
            `${withoutForm} dispensations of ${data.substance.name} (requires special form) missing form number`
          );
        }
      }
    }

    return {
      id: `report-${pharmacyId}-${startDate.getTime()}`,
      pharmacyId,
      reportPeriod: { startDate, endDate },
      totalDispensations: periodDispensations.length,
      substanceBreakdown: Object.fromEntries(
        Array.from(substanceMap.entries()).map(([id, data]) => [
          id,
          {
            name: data.substance.name,
            schedule: data.substance.schedule,
            count: data.count,
            totalQuantity: data.totalQuantity,
          },
        ])
      ),
      flaggedPatients: Array.from(patientAlertsMap.entries()).map(
        ([patientId, data]) => ({
          patientId,
          ...data,
        })
      ),
      complianceIssues,
      generatedAt: new Date(),
    };
  }

  /**
   * Generates Swissmedic quarterly reporting data
   */
  async generateSwissmedecQuarterlyReport(
    pharmacyId: string,
    year: number,
    quarter: number
  ): Promise<SwissmedecReportingData> {
    // Calculate quarter dates
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);

    // Get dispensations
    const dispensations = await this.dispensationRepository.find({
      where: { pharmacyId },
      order: { dispensedDate: 'DESC' },
    });

    const periodDispensations = dispensations.filter(
      (d) => d.dispensedDate >= startDate && d.dispensedDate <= endDate
    );

    // Group by substance
    const substanceMap = new Map<
      string,
      {
        name: string;
        schedule: DrugSchedule;
        count: number;
        totalQuantity: number;
      }
    >();

    for (const disp of periodDispensations) {
      const substance = await this.substanceRepository.findOne({
        where: { id: disp.substanceId },
      });

      if (!substance) continue;

      if (!substanceMap.has(disp.substanceId)) {
        substanceMap.set(disp.substanceId, {
          name: substance.name,
          schedule: substance.schedule,
          count: 0,
          totalQuantity: 0,
        });
      }

      const entry = substanceMap.get(disp.substanceId)!;
      entry.count += 1;
      entry.totalQuantity += disp.quantityDispensed;
    }

    // Get alerts for period
    const alerts = await this.alertRepository.find({
      where: {
        pharmacyId,
      },
      order: { createdAt: 'DESC' },
    });

    const periodAlerts = alerts.filter(
      (a) =>
        a.createdAt >= startDate &&
        a.createdAt <= endDate &&
        !a.resolvedAt
    );

    return {
      pharmacyId,
      pharmacyName: '', // Will be populated from pharmacy service
      reportingPeriod: { year, quarter },
      dispensations: periodDispensations,
      totalDispensations: periodDispensations.length,
      substancesSummary: Array.from(substanceMap.entries()).map(([id, data]) => ({
        substanceId: id,
        substanceName: data.name,
        schedule: data.schedule,
        dispensationCount: data.count,
        totalQuantity: data.totalQuantity,
      })),
      flags: periodAlerts,
      submissionDate: undefined,
    };
  }

  /**
   * Generates monthly trend report
   */
  async generateMonthlyTrendReport(
    pharmacyId: string,
    months: number = 12
  ): Promise<{
    trends: Array<{
      month: string;
      totalDispensations: number;
      totalQuantity: number;
      alertCount: number;
    }>;
  }> {
    const trends: Array<{
      month: string;
      totalDispensations: number;
      totalQuantity: number;
      alertCount: number;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const dispensations = await this.dispensationRepository.find({
        where: { pharmacyId },
      });

      const monthDisp = dispensations.filter(
        (d) => d.dispensedDate >= monthStart && d.dispensedDate <= monthEnd
      );

      const alerts = await this.alertRepository.find({
        where: { pharmacyId },
      });

      const monthAlerts = alerts.filter(
        (a) => a.createdAt >= monthStart && a.createdAt <= monthEnd
      ).length;

      trends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        totalDispensations: monthDisp.length,
        totalQuantity: monthDisp.reduce((sum, d) => sum + d.quantityDispensed, 0),
        alertCount: monthAlerts,
      });
    }

    return { trends };
  }

  /**
   * Exports report as JSON
   */
  exportReportAsJSON(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Exports report as CSV
   */
  exportReportAsCSV(report: ComplianceReport): string {
    const lines: string[] = [];

    // Header
    lines.push('Controlled Substance Compliance Report');
    lines.push(`Pharmacy ID,${report.pharmacyId}`);
    lines.push(
      `Period,"${report.reportPeriod.startDate.toISOString()} to ${report.reportPeriod.endDate.toISOString()}"`
    );
    lines.push(`Total Dispensations,${report.totalDispensations}`);
    lines.push('');

    // Substance breakdown
    lines.push('Substance,Schedule,Dispensations,Total Quantity');
    for (const [, substance] of Object.entries(report.substanceBreakdown)) {
      lines.push(
        `"${substance.name}",${substance.schedule},${substance.count},${substance.totalQuantity}`
      );
    }
    lines.push('');

    // Compliance issues
    lines.push('Compliance Issues');
    for (const issue of report.complianceIssues) {
      lines.push(`"${issue}"`);
    }

    return lines.join('\n');
  }
}
