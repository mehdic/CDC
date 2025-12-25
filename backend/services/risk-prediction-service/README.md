# Risk Prediction Service

AI-powered health risk prediction service for MetaPharm Connect.

## Features

- **Risk Assessment**: Analyzes patient data for health risks
- **Medication Interaction Detection**: Identifies dangerous drug combinations
- **Polypharmacy Analysis**: Assesses risks from multiple medications
- **Chronic Disease Tracking**: Monitors disease progression
- **Alert System**: Notifies providers of high-risk patients
- **Trend Analysis**: Projects future risk based on historical data

## API Endpoints

### Assessment
- `POST /api/risk-prediction/assess` - Perform risk assessment

### History & Trends
- `GET /api/risk-prediction/patient/:id` - Get patient risk history
- `GET /api/risk-prediction/trends/:id` - Get risk trends

### Alerts
- `GET /api/risk-prediction/alerts` - Get all active alerts
- `GET /api/risk-prediction/alerts/patient/:id` - Get patient-specific alerts
- `POST /api/risk-prediction/alerts/:id/acknowledge` - Acknowledge an alert

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
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Risk Scoring Algorithm

### Risk Factors
1. **Medication Interactions**: Detects dangerous drug combinations
2. **Polypharmacy**: 5+ concurrent medications
3. **Chronic Disease Progression**: Uncontrolled or poorly controlled conditions
4. **Age-Related**: Elderly patients (65+)
5. **Comorbidity**: Multiple chronic conditions (2+)

### Risk Levels
- **Low**: Score 0-39
- **Moderate**: Score 40-59
- **High**: Score 60-79
- **Critical**: Score 80-100

### Alert Priorities
- **Urgent**: Critical risk ≥90
- **High**: Critical risk 80-89
- **Medium**: High risk
- **Low**: Others

## Tech Stack

- TypeScript (strict mode)
- Express.js
- Zod (validation)
- Jest (testing)

## Future Enhancements

- Database integration (PostgreSQL)
- Machine learning models
- Integration with drug databases
- Lab result analysis
- Real-time notifications
