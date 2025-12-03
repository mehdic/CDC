# Vaccination Service (T6-013)

Comprehensive vaccination appointment booking and management service for MetaPharm Connect pharmacies.

## Features

- **Slot Template Management**: Recurring vaccination slot configurations
- **Dynamic Slot Generation**: Generate slots from templates for date ranges
- **Booking Management**: Create, cancel, reschedule vaccination appointments
- **Capacity Tracking**: Real-time availability and overbooking prevention
- **Check-in Workflow**: Patient check-in and completion tracking
- **Calendar View**: Day-by-day availability calendar
- **Statistics**: Pharmacy vaccination metrics (completion rate, no-show rate)
- **Multi-Vaccine Support**: COVID-19, Influenza, Hepatitis, HPV, and more

## API Endpoints

### Slot Template Management
- `POST /api/v1/pharmacies/:id/vaccination-slots/templates` - Create slot template
- `GET /api/v1/pharmacies/:id/vaccination-slots/templates` - List pharmacy templates
- `PUT /api/v1/vaccination-slots/templates/:id` - Update template
- `DELETE /api/v1/vaccination-slots/templates/:id` - Delete template
- `POST /api/v1/vaccination-slots/templates/:id/generate` - Generate slots from template

### Availability & Booking
- `GET /api/v1/pharmacies/:id/vaccination-slots/availability` - Get available slots
- `GET /api/v1/pharmacies/:id/vaccination-slots/calendar` - Get calendar view
- `POST /api/v1/vaccination-slots/:id/book` - Book slot
- `GET /api/v1/vaccination-bookings` - List bookings
- `DELETE /api/v1/vaccination-bookings/:id` - Cancel booking
- `PUT /api/v1/vaccination-bookings/:id/reschedule` - Reschedule booking
- `POST /api/v1/vaccination-bookings/:id/check-in` - Check-in patient

### Analytics
- `GET /api/v1/pharmacies/:id/vaccination-stats` - Get pharmacy statistics

## Database Schema

### vaccination_slot_templates
- Recurring slot configurations
- Vaccine type, duration, capacity, day of week, time range

### vaccination_slots
- Generated time slots from templates
- Real-time capacity tracking

### vaccination_bookings
- Patient bookings with status tracking
- Check-in, completion, cancellation support

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
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## Building

```bash
npm run build
```

## Environment Variables

```env
VACCINATION_SERVICE_PORT=4020
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=metapharm
DATABASE_PASSWORD=metapharm_dev_password
DATABASE_NAME=metapharm
```

## License

Proprietary - MetaPharm Connect
