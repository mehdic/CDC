# Appointment Service

Appointment scheduling microservice for MetaPharm Connect. Manages teleconsultations, in-person visits, and home visits with availability management and reminders.

## Features

- **Appointment Scheduling**: Create, update, and cancel appointments
- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Availability Management**: Provider working hours and slot management
- **Reminder System**: Automated reminders (24h and 1h before appointment)
- **Support for Multiple Types**:
  - Teleconsultations
  - In-person visits
  - Home visits
- **Status Tracking**: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
- **Soft Deletes**: All deletions are non-destructive
- **HIPAA/GDPR Compliant**: Secure healthcare data handling

## Project Structure

```
src/
├── entities/              # TypeORM entities
│   ├── Appointment.ts     # Appointment entity
│   ├── AvailabilitySlot.ts # Provider availability slots
│   └── AppointmentReminder.ts # Reminder tracking
├── services/              # Business logic
│   ├── appointment.service.ts  # Appointment operations
│   ├── availability.service.ts # Availability management
│   └── reminder.service.ts     # Reminder handling
├── controllers/           # Route handlers
│   └── appointment.controller.ts
├── routes/               # API routes
│   └── appointment.routes.ts
├── validators/           # Input validation
│   └── appointment.validators.ts
├── types/               # TypeScript types
│   └── appointment.types.ts
└── __tests__/          # Unit tests
    └── appointment.service.test.ts
```

## API Endpoints

### Appointments

- `POST /appointments` - Create appointment
- `GET /appointments` - List appointments (paginated, filtered)
- `GET /appointments/:id` - Get appointment details
- `PUT /appointments/:id` - Update appointment
- `POST /appointments/:id/confirm` - Confirm appointment
- `POST /appointments/:id/cancel` - Cancel appointment
- `POST /appointments/:id/complete` - Mark as completed
- `DELETE /appointments/:id` - Soft delete appointment
- `GET /appointments/provider/:providerId/upcoming` - Get upcoming appointments

### Availability Slots

- `POST /availability` - Create availability slot
- `GET /availability` - List availability slots (paginated, filtered)
- `GET /availability/:id` - Get slot details
- `PUT /availability/:id` - Update slot
- `DELETE /availability/:id` - Delete slot
- `GET /availability/provider/:providerId` - Get provider's slots

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Building

```bash
npm run build
```

## Running

```bash
npm start
```

## Environment Variables

```env
APPOINTMENT_SERVICE_PORT=4014
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=metapharm
DATABASE_PASSWORD=metapharm_dev_password
DATABASE_NAME=metapharm
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header.

## Role-Based Access Control

- **Pharmacist**: Full access to create/manage appointments and availability
- **Doctor**: Can manage own availability and appointments
- **Nurse**: Can book appointments on behalf of patients
- **Patient**: Can view own appointments and cancel

## Key Entities

### Appointment

- `id` - UUID
- `provider_id` - Healthcare professional
- `patient_id` - Patient
- `appointment_type` - TELECONSULTATION | IN_PERSON | HOME_VISIT
- `status` - PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
- `scheduled_start` - Appointment start time
- `scheduled_end` - Appointment end time
- `timezone` - IANA timezone
- `reason` - Reason for visit
- `notes` - Internal notes
- `location` - Physical address for in-person/home visits

### AvailabilitySlot

- `id` - UUID
- `provider_id` - Healthcare professional
- `day_of_week` - 0-6 (Sunday-Saturday)
- `start_time` - HH:mm format
- `end_time` - HH:mm format
- `capacity` - Number of appointments allowed
- `is_recurring` - Repeats weekly
- `is_blocked` - Temporarily unavailable
- `booked_count` - Current bookings

### AppointmentReminder

- `id` - UUID
- `appointment_id` - Related appointment
- `recipient_id` - Patient or provider
- `reminder_type` - EMAIL | SMS | IN_APP | NOTIFICATION
- `status` - PENDING | SENT | FAILED
- `scheduled_at` - When reminder should be sent
- `hours_before_start` - Send X hours before appointment

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (scheduling conflict)
- `500` - Internal Server Error

## Database

PostgreSQL with TypeORM. Migrations required for production deployments.

## Health Check

```bash
curl http://localhost:4014/health
```

Response:
```json
{
  "status": "healthy",
  "service": "appointment-service",
  "database": "connected",
  "version": "1.0.0"
}
```

## License

Proprietary - MetaPharm Connect
