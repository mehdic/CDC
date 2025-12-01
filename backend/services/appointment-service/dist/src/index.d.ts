/**
 * Appointment Service
 * Microservice for appointment scheduling and availability management
 * HIPAA/GDPR Compliant - Healthcare appointment data
 *
 * Endpoints:
 * - POST /appointments - Create appointment
 * - GET /appointments - List appointments (paginated)
 * - GET /appointments/:id - Get single appointment
 * - PUT /appointments/:id - Update appointment
 * - POST /appointments/:id/confirm - Confirm appointment
 * - POST /appointments/:id/cancel - Cancel appointment
 * - POST /appointments/:id/complete - Mark as completed
 * - DELETE /appointments/:id - Soft delete appointment
 * - GET /appointments/provider/:providerId/upcoming - Upcoming appointments
 * - POST /availability - Create availability slot
 * - GET /availability - List availability slots
 * - GET /availability/:id - Get availability slot
 * - PUT /availability/:id - Update availability slot
 * - DELETE /availability/:id - Delete availability slot
 * - GET /availability/provider/:providerId - Get provider slots
 * - GET /health - Health check
 */
import { Express } from 'express';
import { DataSource } from 'typeorm';
export declare const AppDataSource: DataSource;
declare const app: Express;
export default app;
//# sourceMappingURL=index.d.ts.map