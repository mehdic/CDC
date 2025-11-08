# Doctor App - MetaPharm Connect

Mobile application for doctors to create and send prescriptions to pharmacies.

## Features

- **Patient Selection**: Search patients by name/email with recent patients quick access
- **Pharmacy Selection**: Find pharmacies by name/location with nearby suggestions
- **Drug Search**: AI-powered medication search with autocomplete and suggestions
- **Dosage Configuration**: Complete dosage picker with form, strength, frequency, and duration
- **Multi-Medication**: Support for multiple medications in a single prescription
- **Prescription Review**: Confirmation screen before sending to pharmacy
- **Authentication**: Secure login with HIN e-ID support

## Tech Stack

- **Framework**: React Native 0.73
- **Navigation**: React Navigation (Stack Navigator)
- **API Client**: Axios
- **Language**: TypeScript
- **Testing**: Jest + React Native Testing Library

## Project Structure

```
doctor-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── DrugSearch.tsx
│   │   ├── DosagePicker.tsx
│   │   ├── PatientSelector.tsx
│   │   └── PharmacySelector.tsx
│   ├── screens/          # Screen components
│   │   ├── CreatePrescriptionScreen.tsx
│   │   └── SendConfirmationScreen.tsx
│   ├── services/         # API services
│   │   └── api.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── navigation/       # Navigation configuration
│   │   └── types.ts
│   └── App.tsx           # Main app component
├── __tests__/            # Test files
│   ├── integration/
│   │   └── prescription-workflow.test.ts
│   └── components/
│       └── DrugSearch.test.tsx
└── package.json
```

## Tasks Completed

- ✅ **T122**: Initialize Doctor App with navigation and auth
- ✅ **T123**: Create Prescription Creation screen
- ✅ **T124**: Implement drug search with AI suggestions
- ✅ **T125**: Implement dosage picker
- ✅ **T126**: Create patient selector
- ✅ **T127**: Create pharmacy selector
- ✅ **T128**: Implement send confirmation screen

## Installation

```bash
cd mobile/doctor-app
npm install
```

## Running

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Integration

The app integrates with the following backend services:

- **Prescription Service**: POST /prescriptions (create prescription)
- **Patient Service**: GET /patients (search patients)
- **Pharmacy Service**: GET /pharmacies (search pharmacies)
- **Drug Service**: GET /drugs/search (AI-powered drug search)

## Environment Variables

Create a `.env` file with:

```
REACT_APP_API_URL=http://localhost:4000
```

## Key Components

### DrugSearch
- Real-time autocomplete search
- AI-powered suggestions
- Confidence scoring
- RxNorm code lookup

### DosagePicker
- Form selection (tablet, capsule, liquid, etc.)
- Strength input
- Frequency picker
- Duration selection
- Quantity calculation

### PatientSelector
- Patient search
- Recent patients
- Allergy warnings

### PharmacySelector
- Pharmacy search
- Nearby pharmacies
- Distance display

## Workflow

1. Doctor selects patient
2. Doctor selects pharmacy
3. Doctor searches and adds medications
4. Doctor configures dosage for each medication
5. Doctor reviews prescription
6. Doctor sends to pharmacy

## Security

- JWT authentication
- Secure API calls
- HIPAA compliance
- Encrypted patient data

## License

Proprietary - MetaPharm Connect
