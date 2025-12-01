"use strict";
/**
 * Appointment Types
 * Type definitions for appointment scheduling system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderStatus = exports.ReminderType = exports.AppointmentStatus = exports.AppointmentType = void 0;
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["TELECONSULTATION"] = "teleconsultation";
    AppointmentType["IN_PERSON"] = "in_person";
    AppointmentType["HOME_VISIT"] = "home_visit";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "pending";
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["IN_PROGRESS"] = "in_progress";
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["NO_SHOW"] = "no_show";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var ReminderType;
(function (ReminderType) {
    ReminderType["EMAIL"] = "email";
    ReminderType["SMS"] = "sms";
    ReminderType["IN_APP"] = "in_app";
    ReminderType["NOTIFICATION"] = "notification";
})(ReminderType || (exports.ReminderType = ReminderType = {}));
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["PENDING"] = "pending";
    ReminderStatus["SENT"] = "sent";
    ReminderStatus["FAILED"] = "failed";
})(ReminderStatus || (exports.ReminderStatus = ReminderStatus = {}));
//# sourceMappingURL=appointment.types.js.map