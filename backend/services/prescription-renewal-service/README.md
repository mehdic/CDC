# Prescription Renewal Service

AI-powered prescription renewal prediction and reminder service for MetaPharm Connect platform.

**Task:** T8-055 - Auto-Renewal Predictions

## Features

- **AI-Powered Predictions**: Generate renewal timing predictions based on patient refill history and medication adherence
- **Multi-Channel Reminders**: Schedule and send reminders via email, SMS, push notifications, and in-app messages
- **Pharmacist Workflow**: Approve/reject predictions with notes and automatic reminder scheduling
- **Analytics Dashboard**: Track prediction accuracy, renewal rates, and patient engagement

## Architecture

### Database Models

- **RenewalPrediction**: Stores AI-generated renewal predictions with confidence scores
- **RenewalReminder**: Manages scheduled reminders with multi-channel delivery support

### Services

- **RenewalPredictionService**: Generates predictions using rule-based algorithm (MVP) with hooks for ML model integration
- **RenewalSchedulerService**: Schedules and sends reminders across multiple channels

### API Endpoints

#### Predictions

- `POST /api/renewals/predictions` - Generate new prediction
- `GET /api/renewals/predictions/:id` - Get prediction by ID
- `GET /api/renewals/predictions/patient/:patientId` - Get patient predictions
- `GET /api/renewals/predictions/pharmacy/:pharmacyId/pending` - Get pharmacy pending predictions
- `GET /api/renewals/predictions/attention` - Get predictions requiring attention
- `PATCH /api/renewals/predictions/:id` - Update prediction
- `POST /api/renewals/predictions/:id/approve` - Approve and schedule reminders
- `POST /api/renewals/predictions/:id/reject` - Reject prediction

#### Reminders

- `GET /api/renewals/reminders/patient/:patientId` - Get patient reminders
- `POST /api/renewals/reminders` - Create manual reminder
- `POST /api/renewals/reminders/process` - Process due reminders (cron)
- `DELETE /api/renewals/reminders/:id` - Cancel reminder

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- TypeScript 5+

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3007
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=metapharm
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Prediction Algorithm

### MVP: Rule-Based Algorithm

Current implementation uses a rule-based algorithm:

1. Analyze patient refill history (days between refills)
2. Calculate average refill interval
3. Calculate adherence rate
4. Adjust confidence based on:
   - Data quality (number of historical refills)
   - Chronic condition flag
   - Medication type

5. Predict next renewal date: `current_date + average_interval`

### Future: ML Model Integration

Designed to integrate with AWS Sagemaker or other ML platforms:

```typescript
// Future implementation
private async callMLModel(features: PredictionFeatures): Promise<PredictionResult> {
  // Call AWS Sagemaker endpoint
  const response = await axios.post(ML_ENDPOINT, features);
  return response.data;
}
```

## Reminder Scheduling

When a prediction is approved, the system automatically schedules 3 reminders:

1. **7 days before** - Email reminder
2. **3 days before** - Push notification
3. **On predicted date** - SMS reminder

## Notification Providers

### MVP: Mock Delivery

Current implementation simulates delivery with 95% success rate.

### Future: Production Integration

- **Email**: SendGrid
- **SMS**: Twilio
- **Push**: Firebase Cloud Messaging
- **In-App**: Socket.IO real-time

## Testing

Test coverage: 21 unit tests covering:

- Prediction generation with various scenarios
- Reminder scheduling and delivery
- Error handling and edge cases
- Status transitions (pending → approved/rejected)

## Database Schema

### renewal_predictions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| prescriptionId | VARCHAR | Reference to prescription |
| patientId | VARCHAR | Reference to patient |
| pharmacyId | VARCHAR | Reference to pharmacy |
| predictedDate | TIMESTAMP | Predicted renewal date |
| confidence | ENUM | low/medium/high |
| confidenceScore | DECIMAL | 0-100 score |
| status | ENUM | pending/approved/rejected/expired |
| predictionFactors | JSONB | ML features |
| approvedBy | VARCHAR | Pharmacist ID |
| approvedAt | TIMESTAMP | Approval timestamp |
| notes | TEXT | Pharmacist notes |

### renewal_reminders

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| predictionId | UUID | Foreign key to prediction |
| patientId | VARCHAR | Reference to patient |
| scheduledFor | TIMESTAMP | Send date/time |
| status | ENUM | scheduled/sent/failed/cancelled |
| channel | ENUM | email/sms/push/in_app |
| message | TEXT | Reminder content |
| sentAt | TIMESTAMP | Delivery timestamp |
| deliveryMetadata | JSONB | Provider response |
| retryCount | INTEGER | Retry attempts |
| maxRetries | INTEGER | Max retry limit |

## Performance Considerations

- Indexed columns for fast queries (patientId, pharmacyId, status, predictedDate)
- JSONB fields for flexible metadata storage
- Batch processing for reminder delivery
- Automatic retry mechanism (up to 3 attempts)

## Security

- Input validation on all endpoints
- Error messages sanitized (no internal details exposed)
- Database prepared statements (TypeORM)
- Future: API authentication via JWT

## Monitoring

- Health check endpoint: `GET /health`
- Error logging via console (future: Sentry integration)
- Delivery tracking via metadata

## Future Enhancements

1. ML model integration (AWS Sagemaker)
2. Production notification providers (Twilio, SendGrid, FCM)
3. Advanced analytics dashboard
4. Patient preference management
5. A/B testing for reminder timing
6. Prediction accuracy tracking and feedback loop

## License

Proprietary - MetaPharm Connect Platform
