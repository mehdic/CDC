/**
 * Appointment Routes
 * RESTful API endpoints for appointment scheduling
 * HIPAA/GDPR Compliant - Protected by JWT auth and RBAC
 */
import { AppointmentController } from '../controllers/appointment.controller';
declare const router: import("express-serve-static-core").Router;
/**
 * Initialize controller (called from index.ts after dependencies are set up)
 */
export declare function initializeRoutes(controller: AppointmentController): void;
export default router;
//# sourceMappingURL=appointment.routes.d.ts.map