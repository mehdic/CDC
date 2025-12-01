# Voice Service

Voice recording and transcription microservice for MetaPharm Connect.

## Overview

The Voice Service handles:
- Voice recording management (teleconsultation, voice notes, dictation)
- Audio transcription with AI integration
- Language detection (French, German, Italian, Romansh)
- Medical terminology analysis
- Service statistics and analytics

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with TypeORM
- **Testing**: Jest
- **AI Integration**: OpenAI Whisper API (stub implementation for production integration)

## Features

### Voice Recording Management
- Create, retrieve, list, and delete voice recordings
- Support for multiple audio formats (MP3, WAV, OGG, FLAC, M4A)
- Metadata tracking (user, role, conversation, appointment context)
- Recording status tracking (PENDING, PROCESSING, COMPLETED, FAILED)

### Transcription
- Automatic transcription of audio files
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

## API Endpoints

### Recordings
- `POST /api/voice/recordings` - Create a voice recording
- `GET /api/voice/recordings/:id` - Get recording by ID
- `GET /api/voice/recordings` - List recordings with filters
- `DELETE /api/voice/recordings/:id` - Delete recording

### Transcriptions
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

## Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=metapharm_voice

AI_API_KEY=your-api-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=whisper-1

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

## Future Enhancements

1. **Real AI Integration**: Replace stub with production API calls
2. **WebSocket Streaming**: Real-time transcription streaming
3. **Advanced Filtering**: Enhanced search and filter capabilities
4. **Webhook Integration**: Event notifications for completed transcriptions
5. **Batch Processing**: Background job queue for bulk transcriptions
6. **Caching**: Redis caching for frequently accessed transcriptions
7. **Analytics Dashboard**: Enhanced statistics and reporting
8. **Custom Vocabulary**: Domain-specific medical terminology support

## License

Proprietary - MetaPharm Connect
