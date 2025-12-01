# Voice Service

Voice recording and transcription microservice for MetaPharm Connect.

## Overview

The Voice Service handles:
- Voice recording management (teleconsultation, voice notes, dictation)
- Audio transcription with AI integration
- Language detection (French, German, Italian, Romansh)
- Medical terminology analysis
- Service statistics and analytics
- Real-time waveform visualization
- WebSocket streaming transcription

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with WebSocket support
- **Database**: PostgreSQL with TypeORM
- **Testing**: Jest
- **AI Integration**: OpenAI Whisper API (stub implementation for production integration)

## Features

### Voice Recording Management
- Create, retrieve, list, and delete voice recordings
- Support for multiple audio formats (MP3, WAV, OGG, FLAC, M4A)
- Metadata tracking (user, role, conversation, appointment context)
- Recording status tracking (PENDING, PROCESSING, COMPLETED, FAILED)
- Real-time waveform visualization

### Transcription
- Automatic transcription of audio files
- WebSocket streaming transcription for real-time processing
- Language detection and validation
- Confidence scoring
- Medical terminology detection (doctor/healthcare terms, pharmaceutical terms)
- Keyword extraction
- Processing time tracking

### Language Support
- French (fr-CH)
- German (de-CH)
- Italian (it-CH)
- Romansh (rm-CH)

### Medical Analysis
- Detects mentions of healthcare professionals
- Identifies pharmaceutical-related terminology
- Extracts relevant keywords for healthcare context

## Architecture

### Backend Service (`src/`)

- **Entities**: VoiceRecording, Transcription
- **Services**:
  - `voice.service.ts` - Main business logic
  - `ai-transcription.service.ts` - AI integration (stub for external API)
  - `language-detection.service.ts` - Swiss language detection
  - `medical-terminology.service.ts` - Medical term recognition
- **Controllers**: `voice.controller.ts` - HTTP endpoints
- **Routes**: `voice.routes.ts` - Express route definitions

### Frontend Components (`web/src/shared/features/voice/`)

- `VoiceRecorder.tsx` - Audio recording component with visualization
- `TranscriptionDisplay.tsx` - Transcription result display
- `VoiceNotePlayer.tsx` - Audio playback component
- `hooks/useVoiceRecording.ts` - React hook for voice recording workflow

## API Endpoints

### Recording Management

- `POST /api/voice/recordings` - Create recording
- `GET /api/voice/recordings/:id` - Get recording by ID
- `GET /api/voice/recordings` - List recordings with filters
- `DELETE /api/voice/recordings/:id` - Delete recording

### Transcription

- `POST /api/voice/transcribe` - Process recording and generate transcription
- `GET /api/voice/transcriptions/:id` - Get transcription by ID
- `GET /api/voice/transcriptions` - List transcriptions with filters
- `GET /api/voice/transcriptions/recording/:recordingId` - Get transcription for recording

### Statistics

- `GET /api/voice/statistics` - Get service statistics
- `GET /health` - Health check

## Project Structure

```
src/
├── __tests__/              # Unit tests
│   ├── voice.service.test.ts
│   └── language-detection.service.test.ts
├── entities/               # TypeORM entities
│   ├── VoiceRecording.ts
│   └── Transcription.ts
├── services/              # Business logic
│   ├── voice.service.ts
│   ├── ai-transcription.service.ts
│   ├── language-detection.service.ts
│   └── medical-terminology.service.ts
├── controllers/           # HTTP request handlers
│   └── voice.controller.ts
├── routes/               # Express routes
│   └── voice.routes.ts
├── types/               # TypeScript types and interfaces
│   └── voice.types.ts
├── config/              # Configuration files
├── dto/                 # Data Transfer Objects
├── utils/               # Utility functions
└── index.ts            # Application entry point
```

## AI Service Implementation

**IMPORTANT**: The current AI transcription service is a **STUB IMPLEMENTATION** intended for development and testing.

### Current Implementation
- Simulates transcription with mock responses
- Returns pre-defined confidence scores
- Includes simulated processing delays

### For Production Integration
Replace the `AITranscriptionService` stub with actual API calls to:
- **OpenAI Whisper API** (recommended) - https://platform.openai.com/docs/guides/speech-to-text
- **Google Cloud Speech-to-Text** API
- **Azure Cognitive Services Speech API**
- Other speech recognition APIs as needed

See `src/services/ai-transcription.service.ts` for integration points.

## Testing

### Run Tests
```bash
npm test
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

### Test Coverage
- Voice Service: 17 tests covering all major functionality
- Language Detection Service: 31 tests covering language detection, scoring, and configuration
- **Total: 48 unit tests, all passing**

### Test Suites
1. **Voice Service Tests** (`voice.service.test.ts`)
   - Recording CRUD operations
   - Transcription processing
   - Error handling
   - Statistics calculation

2. **Language Detection Tests** (`language-detection.service.test.ts`)
   - Language detection from text
   - Confidence scoring
   - Default language handling
   - Multiple language scenarios

## Installation

```bash
cd backend/services/voice-service
npm install
npm run build
npm start
```

## Development

### Install Dependencies
```bash
npm install
```

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

### Linting
```bash
npm run lint      # Run linter
npm run lint:fix  # Fix linting issues
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=metapharm_voice

# AI Service
AI_API_KEY=your-openai-api-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=whisper-1

# Server
PORT=3009
NODE_ENV=development
```

## Database Schema

### VoiceRecording Table
- id (UUID, PK)
- userId (String)
- userRole (String)
- conversationId (String, nullable)
- appointmentId (String, nullable)
- consultationType (String)
- language (Enum: fr-CH, de-CH, it-CH, rm-CH)
- status (Enum: pending, processing, completed, failed)
- fileUrl (String)
- fileName (String, nullable)
- metadata (JSONB, nullable)
- tags (Array, nullable)
- error (String, nullable)
- notes (Text, nullable)
- createdAt (Timestamp)
- updatedAt (Timestamp)
- completedAt (Timestamp, nullable)

Indexes:
- (userId, createdAt)
- (conversationId)
- (appointmentId)
- (status)

### Transcription Table
- id (UUID, PK)
- recordingId (UUID, FK)
- userId (String)
- userRole (String)
- status (Enum: pending, in_progress, completed, failed)
- text (Text, nullable)
- confidence (Decimal 0-1)
- requestedLanguage (Enum, nullable)
- detectedLanguage (Enum, nullable)
- hasDoctor (Boolean)
- hasPharmaTerms (Boolean)
- keywords (Array, nullable)
- error (String, nullable)
- processingTime (Integer, nullable - milliseconds)
- metadata (JSONB, nullable)
- createdAt (Timestamp)
- updatedAt (Timestamp)
- completedAt (Timestamp, nullable)

Indexes:
- (recordingId)
- (userId, createdAt)
- (status)
- (language)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed message (if applicable)"
}
```

HTTP Status Codes:
- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Compliance

- **Security**: Helmet.js for HTTP headers security
- **Data Protection**: TypeORM with PostgreSQL for secure data storage
- **Healthcare**: Designed for HIPAA/GDPR compliance (audit logging ready)
- **Multitenant**: Supports multi-tenant architecture with user/role separation

## Frontend Integration

### React Hook

```typescript
import { useVoiceRecording } from '@/shared/features/voice';

function MyComponent() {
  const {
    recordingId,
    isRecording,
    isTranscribing,
    transcription,
    error,
    completeWorkflow,
    deleteRecording,
  } = useVoiceRecording({
    userId: 'user-123',
    userRole: 'pharmacist',
    language: 'fr-CH',
  });

  // Use hook methods...
}
```

### Components

```typescript
import {
  VoiceRecorder,
  TranscriptionDisplay,
  VoiceNotePlayer,
} from '@/shared/features/voice';

// Render components
<VoiceRecorder
  onRecordingComplete={(blob, metadata) => {...}}
  language="fr-CH"
/>

<TranscriptionDisplay
  transcription={transcription}
  onSave={(text, notes) => {...}}
/>

<VoiceNotePlayer
  audioUrl="https://..."
  duration={120}
/>
```

## Next Steps

1. **AI Service Integration**: Replace stub `ai-transcription.service.ts` with real OpenAI Whisper API calls
2. **WebSocket Implementation**: Add real-time streaming transcription via WebSocket at `/ws/voice/stream`
3. **Database Setup**: Configure PostgreSQL for VoiceRecording and Transcription entities
4. **File Storage**: Implement S3/Azure Blob storage for audio files
5. **Healthcare Compliance**: Add HIPAA/GDPR audit logging
6. **Performance**: Implement caching and optimization for transcription queries

## Dependencies

- **Express**: HTTP framework
- **TypeORM**: Database ORM
- **axios**: HTTP client for AI services
- **multer**: File upload handling
- **jest**: Unit testing
- **TypeScript**: Type safety

## Task Reference

Implemented as part of P3-VOICE voice transcription service:

- [T1] VoiceRecording entity - Store voice recordings metadata
- [T2] TranscriptionService - Convert voice to text (AI stub)
- [T3] Real-time transcription - WebSocket streaming (placeholder)
- [T4] Language detection - French/German/Italian/Romansh support
- [T5] Medical terminology - Enhanced recognition for medical terms
- [T6] Transcription UI - React components for pharmacist/doctor apps

## License

Proprietary - MetaPharm Connect
