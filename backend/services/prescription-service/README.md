# Prescription Service

**Port**: 4002
**Purpose**: Prescription Upload & AI-powered OCR Transcription
**AWS Integration**: S3 (storage) + Textract (OCR)

---

## Overview

The Prescription Service enables patients and healthcare providers to upload prescription images and automatically extract medication information using AWS Textract OCR with AI confidence scoring.

## Features Implemented

### T077: Service Initialization ✅
- Express server on port 4002
- TypeORM database integration (PostgreSQL)
- Helmet security middleware
- CORS enabled
- Graceful shutdown handling
- Health check endpoint

### T078-T079: Prescription Upload ✅
- **POST /prescriptions** - Upload prescription image
- File validation (JPG, PNG, PDF max 10MB)
- Multer multipart/form-data handling
- S3 upload with encryption (AES256)
- Database record creation with status tracking

### T080-T081: AI Transcription ✅
- **POST /prescriptions/:id/transcribe** - Trigger OCR
- AWS Textract integration for text extraction
- Line-by-line confidence scoring
- Error handling for invalid images
- Status management (pending → in_review → transcribed)

### T082: AI Confidence Scoring ✅
- Field-level confidence tracking (medication name, dosage, frequency)
- Overall prescription confidence calculation
- 0-1 scale confidence scores
- Percentage conversion utilities

### T083: Low-Confidence Highlighting (FR-013a) ✅
- Identifies fields with confidence < 70% (configurable threshold)
- Returns `low_confidence_fields` array in API response
- Flags prescriptions needing pharmacist review
- Implements FR-013a visual warning requirements

## API Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "prescription-service",
  "port": 4002,
  "timestamp": "2025-11-07T21:00:00.000Z"
}
```

### 2. Upload Prescription
```http
POST /prescriptions
Content-Type: multipart/form-data
```

**Body:**
- `image` (file): Prescription image (JPG, PNG, PDF max 10MB)
- `patient_id` (string): Patient UUID
- `uploaded_by_type` (string): 'patient' | 'doctor' | 'nurse'
- `uploaded_by_id` (string): Uploader UUID
- `pharmacy_id` (string, optional): Pharmacy UUID

**Response (201):**
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "image_url": "https://bucket.s3.region.amazonaws.com/prescriptions/...",
  "status": "pending",
  "source": "patient_upload",
  "created_at": "2025-11-07T21:00:00.000Z"
}
```

### 3. Transcribe Prescription
```http
POST /prescriptions/:id/transcribe
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "pending",
  "ai_confidence": 85,
  "items": [
    {
      "id": "uuid",
      "medication_name": "Aspirin",
      "dosage": "500mg",
      "frequency": "twice daily",
      "duration": "7 days",
      "confidence_scores": {
        "name": 95,
        "dosage": 90,
        "frequency": 85
      },
      "low_confidence_fields": [],
      "requires_review": false
    }
  ],
  "transcription_completed_at": "2025-11-07T21:01:00.000Z"
}
```

## Architecture

```
prescription-service/
├── src/
│   ├── index.ts                    # Express server
│   ├── routes/
│   │   ├── prescriptions.ts        # Upload routes
│   │   └── transcribe.ts           # Transcription routes
│   ├── controllers/
│   │   ├── uploadController.ts     # Upload logic
│   │   └── transcribeController.ts # Transcription logic
│   ├── services/
│   │   └── s3.service.ts           # AWS S3 integration
│   ├── integrations/
│   │   └── textract.ts             # AWS Textract integration
│   └── utils/
│       ├── medicationParser.ts     # OCR text parsing
│       └── aiConfidence.ts         # Confidence scoring
├── package.json
├── tsconfig.json
└── .env.example
```

## Configuration

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION` - AWS region (default: eu-central-1)
- `AWS_S3_BUCKET` - S3 bucket for prescription images

Optional:
- `PORT` - Server port (default: 4002)
- `MAX_FILE_SIZE_MB` - Upload limit (default: 10)
- `ALLOWED_FILE_TYPES` - Comma-separated MIME types
- `AI_CONFIDENCE_THRESHOLD` - Low confidence threshold (default: 0.7)

## Medication Parser

Supports multi-language patterns (French, German, English) for Swiss market:

**Medication Names:**
- Generic drug suffixes: -cin, -pine, -pril, -sartan, -ol, -ide, -ine
- Common medications: Aspirin, Ibuprofen, Paracetamol, Metformin, etc.

**Dosage:**
- Patterns: `500mg`, `10ml`, `2g`, `100mcg`, `50IU`

**Frequency:**
- English: "twice daily", "3x per day"
- French: "2 fois par jour"
- German: "3 mal täglich"

**Duration:**
- Days, weeks, months
- Multi-language: "for 7 days", "pendant 14 jours", "während 2 Wochen"

## Confidence Scoring

### Field-Level Scoring
Each medication field receives a confidence score (0-1 scale):
- **medication_name_confidence**
- **dosage_confidence**
- **frequency_confidence**

### Overall Prescription Confidence
Average of all field confidences across all medications.

### Low Confidence Detection (FR-013a)
Fields with confidence < 70% are flagged for pharmacist review:
- Returned in `low_confidence_fields` array
- UI must display visual warnings (red/yellow indicators)
- Pharmacist must explicitly verify before approval

## Status Flow

```
pending → in_review → (transcription) → pending (awaiting pharmacist)
                                    ↓
                            (if confidence < 70%)
                                    ↓
                            needs_review (flagged)
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Start production build
npm start
```

## Integration with Phase 2

Depends on:
- ✅ **Database Schema**: Prescription, PrescriptionItem, TreatmentPlan entities
- ✅ **S3 Configuration**: AWS credentials and bucket setup
- ✅ **Auth Service**: User authentication (for uploaded_by_id validation)

## Future Enhancements

- Drug database integration for medication name validation
- RxNorm code lookup for standardization
- Multi-page PDF support
- Handwriting recognition improvements
- Drug interaction checking during transcription
- Allergy warnings during transcription

---

**Status**: ✅ Complete (All 7 tasks: T077-T083)
**Lines of Code**: 1,081 LOC (9 TypeScript files)
**Build**: ✅ Successful
**Tests**: Basic test structure created
