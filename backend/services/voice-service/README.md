# Voice Service

Voice recording and transcription service for MetaPharm Connect teleconsultations and voice notes.

## Features

- Voice recording with real-time waveform visualization
- Audio transcription with AI (OpenAI Whisper API integration)
- Language detection (French, German, Italian, Romansh - Swiss multilingual support)
- Medical terminology recognition (doctor terms, pharmaceutical terms)
- WebSocket streaming transcription
- Recording metadata and confidence scoring

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

- `POST /api/voice/transcribe` - Process recording and transcribe
- `GET /api/voice/transcriptions/:id` - Get transcription
- `GET /api/voice/transcriptions` - List transcriptions
- `GET /api/voice/transcriptions/recording/:recordingId` - Get transcription for recording

### Statistics

- `GET /api/voice/statistics` - Get service statistics

## Supported Languages

- French (Swiss) - fr-CH
- German (Swiss) - de-CH
- Italian (Swiss) - it-CH
- Romansh (Swiss) - rm-CH

## Installation

```bash
cd backend/services/voice-service
npm install
npm run build
npm start
```

## Development

```bash
npm run dev     # Development server with auto-reload
npm run test    # Run unit tests
npm run lint    # Run linter
npm run lint:fix # Fix linting issues
```

## Configuration

Environment variables (create `.env` file):

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

## Testing

The service includes comprehensive unit tests for:

- Voice recording CRUD operations
- Transcription processing
- Language detection (French, German, Italian)
- Medical terminology recognition
- Service statistics

Run tests with:

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # With coverage report
```

## Frontend Integration

### Vue React Hook

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
- **Jest**: Unit testing
- **TypeScript**: Type safety

## Task Reference

Implemented as part of P3-VOICE voice transcription service:

- [T1] VoiceRecording entity - Store voice recordings metadata
- [T2] TranscriptionService - Convert voice to text (AI stub)
- [T3] Real-time transcription - WebSocket streaming (placeholder)
- [T4] Language detection - French/German/Italian/Romansh support
- [T5] Medical terminology - Enhanced recognition for medical terms
- [T6] Transcription UI - React components for pharmacist/doctor apps
