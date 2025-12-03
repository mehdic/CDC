/**
 * Recycling Service Entry Point
 * Medication Return/Recycling Feature
 * T5-052
 */

import recyclingService from './services/recycling.service';
import recyclingReportService from './services/recycling-report.service';
import recyclingRepository from './repositories/RecyclingRepository';

// Export services
export { recyclingService, recyclingReportService, recyclingRepository };

// Export controllers
export * from './controllers/recycling.controller';

// Export types
export * from './types/recycling';

// Export models
export { RecyclingRequestModel } from './models/RecyclingRequest';

export default {
  service: recyclingService,
  reportService: recyclingReportService,
  repository: recyclingRepository,
};
