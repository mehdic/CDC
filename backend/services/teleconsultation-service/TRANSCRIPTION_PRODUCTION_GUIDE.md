# Transcription Service - Production Implementation Guide

## Overview

This guide provides step-by-step instructions to replace the mock transcription provider with Google Cloud Speech-to-Text Medical for production use in MetaPharm Connect.

---

## Prerequisites

1. **Google Cloud Account**
   - Active billing account
   - Speech-to-Text API enabled

2. **Required Packages**
   ```bash
   npm install @google-cloud/speech@^6.0.0
   ```

3. **Environment Variables**
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   PROJECT_ID=your-gcp-project-id
   TRANSCRIPT_ENCRYPTION_KEY=base64-encoded-256-bit-key
   ```

---

## Step 1: Google Cloud Setup

### 1.1 Create Project

```bash
# Set project name
PROJECT_ID="metapharm-transcription"

# Create project
gcloud projects create $PROJECT_ID

# Set as active project
gcloud config set project $PROJECT_ID

# Enable billing (replace BILLING_ACCOUNT_ID)
gcloud beta billing projects link $PROJECT_ID \
  --billing-account=BILLING_ACCOUNT_ID
```

### 1.2 Enable APIs

```bash
# Enable Speech-to-Text API
gcloud services enable speech.googleapis.com

# Verify enabled
gcloud services list --enabled | grep speech
```

### 1.3 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create transcription-sa \
  --display-name="Transcription Service Account" \
  --description="Service account for MetaPharm transcription"

# Grant Speech client role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:transcription-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/speech.client"

# Create and download key
gcloud iam service-accounts keys create ./transcription-key.json \
  --iam-account=transcription-sa@$PROJECT_ID.iam.gserviceaccount.com

# Move key to secure location
mv ./transcription-key.json /etc/metapharm/secrets/
chmod 600 /etc/metapharm/secrets/transcription-key.json
```

### 1.4 Configure Custom Vocabulary (French Medical Terms)

Create `french-medical-vocabulary.json`:

```json
{
  "phraseSet": {
    "phrases": [
      {
        "value": "ibuprofène",
        "boost": 20
      },
      {
        "value": "paracétamol",
        "boost": 20
      },
      {
        "value": "ordonnance",
        "boost": 15
      },
      {
        "value": "prescription",
        "boost": 15
      },
      {
        "value": "maux de tête",
        "boost": 15
      },
      {
        "value": "fièvre",
        "boost": 15
      },
      {
        "value": "comprimé",
        "boost": 10
      },
      {
        "value": "gélule",
        "boost": 10
      },
      {
        "value": "posologie",
        "boost": 10
      },
      {
        "value": "contre-indication",
        "boost": 10
      },
      {
        "value": "effet secondaire",
        "boost": 10
      },
      {
        "value": "allergie",
        "boost": 15
      },
      {
        "value": "douleur",
        "boost": 10
      },
      {
        "value": "traitement",
        "boost": 10
      }
    ]
  }
}
```

Upload to Google Cloud:

```bash
gcloud ml speech phrase-sets create french-medical \
  --location=global \
  --json-file=french-medical-vocabulary.json
```

---

## Step 2: Update Package Dependencies

```bash
cd backend/services/teleconsultation-service

# Install Google Cloud Speech SDK
npm install @google-cloud/speech@^6.0.0

# Update package.json
npm install
```

---

## Step 3: Implement Google Speech Provider

Replace the stub in `src/services/transcription/google-speech-provider.ts`:

```typescript
/**
 * Google Cloud Speech-to-Text Provider (PRODUCTION)
 * Medical-grade transcription for French consultations
 */

import { SpeechClient } from '@google-cloud/speech';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseTranscriptionProvider } from './transcription-provider.interface';
import {
  Transcript,
  TranscriptSegment,
  TranscriptionOptions,
  TranscriptionSession,
  Speaker,
  MedicalTerm,
} from './types';

/**
 * Google Cloud Speech-to-Text provider (PRODUCTION)
 */
export class GoogleSpeechProvider extends BaseTranscriptionProvider {
  readonly name = 'google-speech';
  private client: SpeechClient | null = null;

  async initialize(config: Record<string, any>): Promise<void> {
    this.validateConfig(['GOOGLE_APPLICATION_CREDENTIALS', 'PROJECT_ID']);

    this.client = new SpeechClient({
      keyFilename: config.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: config.PROJECT_ID,
    });

    this.config = config;
    this.initialized = true;

    console.log('[GoogleSpeechProvider] Initialized with project:', config.PROJECT_ID);
  }

  async startStreamTranscription(
    consultationId: string,
    audioStream: NodeJS.ReadableStream,
    options: TranscriptionOptions
  ): Promise<TranscriptionSession> {
    if (!this.client || !this.initialized) {
      throw new Error('Provider not initialized');
    }

    console.log(`[GoogleSpeechProvider] Starting stream transcription for ${consultationId}`);

    const session = new GoogleTranscriptionSession(
      this.client,
      consultationId,
      audioStream,
      options
    );

    await session.start();

    return session;
  }

  async transcribeRecording(
    consultationId: string,
    audioUrl: string,
    options: TranscriptionOptions
  ): Promise<Transcript> {
    if (!this.client || !this.initialized) {
      throw new Error('Provider not initialized');
    }

    console.log(`[GoogleSpeechProvider] Transcribing recording: ${audioUrl}`);

    // Download audio from URL
    const audioBytes = await this.downloadAudio(audioUrl);

    // Configure recognition
    const audio = {
      content: audioBytes.toString('base64'),
    };

    const config = {
      encoding: 'MP3' as const,
      sampleRateHertz: 16000,
      languageCode: options.language || 'fr-CH',
      model: 'medical_conversation',
      useEnhanced: true,
      enableSpeakerDiarization: options.enable_speaker_diarization !== false,
      diarizationSpeakerCount: 2,
      maxAlternatives: 1,
      speechContexts: [
        {
          phrases: [
            'ibuprofène',
            'paracétamol',
            'ordonnance',
            'prescription',
            'maux de tête',
            'fièvre',
            'comprimé',
            'gélule',
            'posologie',
            'contre-indication',
            'effet secondaire',
            'allergie',
          ],
          boost: 20,
        },
      ],
    };

    const request = {
      audio,
      config,
    };

    // Perform recognition
    const [response] = await this.client.recognize(request);

    // Parse results into transcript
    const segments = this.parseGoogleResults(
      response.results || [],
      options.pharmacist_id || 'unknown',
      options.patient_id || 'unknown'
    );

    const transcript: Transcript = {
      id: uuidv4(),
      consultation_id: consultationId,
      segments,
      language: options.language || 'fr-CH',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      summary: this.generateSummary(segments),
      speakers: this.extractSpeakers(segments),
      medical_entities: this.extractMedicalEntities(segments),
    };

    return transcript;
  }

  isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Download audio from URL
   */
  private async downloadAudio(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Parse Google Speech results into transcript segments
   */
  private parseGoogleResults(
    results: any[],
    pharmacistId: string,
    patientId: string
  ): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    let currentTime = 0;

    for (const result of results) {
      const alternative = result.alternatives[0];
      if (!alternative) continue;

      const words = alternative.words || [];
      let currentSpeaker = -1;
      let currentSegmentText = '';
      let segmentStartTime = currentTime;

      words.forEach((wordInfo: any, index: number) => {
        const speakerTag = wordInfo.speakerTag || 0;
        const word = wordInfo.word;
        const startTime = this.parseTime(wordInfo.startTime);
        const endTime = this.parseTime(wordInfo.endTime);

        // New speaker or last word
        if (speakerTag !== currentSpeaker || index === words.length - 1) {
          // Save previous segment
          if (currentSegmentText) {
            segments.push({
              id: uuidv4(),
              text: currentSegmentText.trim(),
              start_time: segmentStartTime,
              end_time: currentTime,
              confidence: alternative.confidence || 0.8,
              speaker: this.getSpeakerInfo(currentSpeaker, pharmacistId, patientId),
              highlighted_terms: this.extractMedicalTerms(currentSegmentText),
            });
          }

          // Start new segment
          currentSpeaker = speakerTag;
          currentSegmentText = word;
          segmentStartTime = startTime;
        } else {
          currentSegmentText += ' ' + word;
        }

        currentTime = endTime;
      });
    }

    return segments;
  }

  /**
   * Parse Google timestamp to seconds
   */
  private parseTime(time: any): number {
    if (!time) return 0;
    const seconds = parseInt(time.seconds || '0');
    const nanos = parseInt(time.nanos || '0');
    return seconds + nanos / 1e9;
  }

  /**
   * Map speaker tag to speaker info
   */
  private getSpeakerInfo(speakerTag: number, pharmacistId: string, patientId: string): Speaker {
    // Speaker 1 = Pharmacist, Speaker 2 = Patient
    if (speakerTag === 1) {
      return {
        id: pharmacistId,
        name: 'Pharmacien',
        role: 'pharmacist',
      };
    } else if (speakerTag === 2) {
      return {
        id: patientId,
        name: 'Patient',
        role: 'patient',
      };
    } else {
      return {
        id: 'unknown',
        role: 'unknown',
      };
    }
  }

  /**
   * Extract medical terms from text
   */
  private extractMedicalTerms(text: string): MedicalTerm[] {
    const terms: MedicalTerm[] = [];

    const patterns = {
      medication: /(ibuprofène|paracétamol|aspirine|amoxicilline)/gi,
      symptom: /(maux de tête|fièvre|toux|douleur|nausée|fatigue)/gi,
      dosage: /(\d+\s?mg)/gi,
      frequency: /(fois par jour|par jour)/gi,
      duration: /(pendant \d+ jours?)/gi,
      allergy: /(allergie)/gi,
    };

    Object.entries(patterns).forEach(([category, pattern]) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          terms.push({
            term: match[0],
            category: category as any,
            start_offset: match.index,
            end_offset: match.index + match[0].length,
            confidence: 0.9,
          });
        }
      }
    });

    return terms;
  }

  /**
   * Generate summary
   */
  private generateSummary(segments: TranscriptSegment[]): string {
    const medications = segments
      .flatMap((s) => s.highlighted_terms || [])
      .filter((t) => t.category === 'medication')
      .map((t) => t.term);

    const symptoms = segments
      .flatMap((s) => s.highlighted_terms || [])
      .filter((t) => t.category === 'symptom')
      .map((t) => t.term);

    const summary = [];
    if (symptoms.length > 0) {
      summary.push(`Symptômes: ${symptoms[0]}`);
    }
    if (medications.length > 0) {
      summary.push(`Traitement: ${medications[0]}`);
    }

    return summary.join('. ') || 'Consultation terminée.';
  }

  /**
   * Extract unique speakers
   */
  private extractSpeakers(segments: TranscriptSegment[]): Speaker[] {
    const speakerMap = new Map<string, Speaker>();

    segments.forEach((segment) => {
      if (segment.speaker) {
        speakerMap.set(segment.speaker.id, segment.speaker);
      }
    });

    return Array.from(speakerMap.values());
  }

  /**
   * Extract medical entities
   */
  private extractMedicalEntities(segments: TranscriptSegment[]) {
    const terms = segments.flatMap((s) => s.highlighted_terms || []);

    return {
      medications: [...new Set(terms.filter((t) => t.category === 'medication').map((t) => t.term))],
      symptoms: [...new Set(terms.filter((t) => t.category === 'symptom').map((t) => t.term))],
      conditions: [...new Set(terms.filter((t) => t.category === 'condition').map((t) => t.term))],
      procedures: [...new Set(terms.filter((t) => t.category === 'procedure').map((t) => t.term))],
    };
  }
}

/**
 * Google streaming transcription session
 */
class GoogleTranscriptionSession extends EventEmitter implements TranscriptionSession {
  readonly id: string;
  readonly consultationId: string;
  status: 'active' | 'paused' | 'stopped' = 'active';

  private segments: TranscriptSegment[] = [];
  private recognizeStream: any;

  constructor(
    private client: SpeechClient,
    consultationId: string,
    private audioStream: NodeJS.ReadableStream,
    private options: TranscriptionOptions
  ) {
    super();
    this.id = uuidv4();
    this.consultationId = consultationId;
  }

  async start(): Promise<void> {
    const request = {
      config: {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: this.options.language || 'fr-CH',
        model: 'medical_conversation',
        useEnhanced: true,
        enableSpeakerDiarization: this.options.enable_speaker_diarization !== false,
        diarizationSpeakerCount: 2,
        speechContexts: [
          {
            phrases: [
              'ibuprofène',
              'paracétamol',
              'ordonnance',
              'prescription',
              'maux de tête',
            ],
            boost: 20,
          },
        ],
      },
      interimResults: true,
    };

    this.recognizeStream = this.client.streamingRecognize(request);

    // Pipe audio to recognition
    this.audioStream.pipe(this.recognizeStream);

    // Handle results
    this.recognizeStream.on('data', (data: any) => {
      const results = data.results;
      if (results && results.length > 0 && results[0].isFinal) {
        const alternative = results[0].alternatives[0];
        if (alternative) {
          const segment: TranscriptSegment = {
            id: uuidv4(),
            text: alternative.transcript,
            start_time: this.getCurrentTime(),
            end_time: this.getCurrentTime() + 5,
            confidence: alternative.confidence || 0.8,
            speaker: this.getSpeaker(),
            highlighted_terms: [],
          };

          this.segments.push(segment);
          this.emit('segment', segment);
        }
      }
    });

    // Handle errors
    this.recognizeStream.on('error', (error: Error) => {
      this.emit('error', error);
    });

    // Handle end
    this.recognizeStream.on('end', () => {
      const transcript = this.buildTranscript();
      this.emit('complete', transcript);
      this.status = 'stopped';
    });
  }

  async stop(): Promise<Transcript> {
    this.status = 'stopped';
    if (this.recognizeStream) {
      this.recognizeStream.end();
    }
    return this.buildTranscript();
  }

  async pause(): Promise<void> {
    this.status = 'paused';
  }

  async resume(): Promise<void> {
    this.status = 'active';
  }

  private getCurrentTime(): number {
    return this.segments.length * 5;
  }

  private getSpeaker(): Speaker {
    return {
      id: this.options.pharmacist_id || 'unknown',
      name: 'Pharmacien',
      role: 'pharmacist',
    };
  }

  private buildTranscript(): Transcript {
    return {
      id: uuidv4(),
      consultation_id: this.consultationId,
      segments: this.segments,
      language: this.options.language || 'fr-CH',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
```

---

## Step 4: Update Service Configuration

In `src/services/transcription/index.ts`:

```typescript
import { GoogleSpeechProvider } from './google-speech-provider';
import { MockTranscriptionProvider } from './mock-transcription-provider';
import { TranscriptionService } from './transcription-service';

/**
 * Initialize transcription service with appropriate provider
 */
export async function initializeTranscriptionService(): Promise<TranscriptionService> {
  const useProduction = process.env.NODE_ENV === 'production';

  let provider;

  if (useProduction && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Production: Use Google Cloud Speech
    console.log('[Transcription] Initializing Google Cloud Speech provider');
    provider = new GoogleSpeechProvider();
    await provider.initialize({
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      PROJECT_ID: process.env.PROJECT_ID || 'metapharm-transcription',
    });
  } else {
    // Development: Use mock provider
    console.log('[Transcription] Initializing Mock provider (development mode)');
    provider = new MockTranscriptionProvider();
    await provider.initialize({});
  }

  const service = new TranscriptionService(provider);
  await service.initialize();

  return service;
}

export * from './types';
export * from './transcription-service';
```

In `src/index.ts`:

```typescript
import { initializeTranscriptionService } from './services/transcription';

// Initialize transcription service
const transcriptionService = await initializeTranscriptionService();
app.locals.transcriptionService = transcriptionService;

console.log(`[App] Transcription service initialized with provider: ${transcriptionService.provider.name}`);
```

---

## Step 5: Environment Configuration

Create `.env.production`:

```bash
# Node environment
NODE_ENV=production

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/etc/metapharm/secrets/transcription-key.json
PROJECT_ID=metapharm-transcription

# Encryption
TRANSCRIPT_ENCRYPTION_KEY=<base64-encoded-256-bit-key>

# Database
TRANSCRIPTS_DB_PATH=/var/lib/metapharm/transcripts.db
```

---

## Step 6: Docker Configuration

Update `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create directories
RUN mkdir -p /var/lib/metapharm /etc/metapharm/secrets

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Run service
CMD ["node", "dist/index.js"]
```

---

## Step 7: Testing

### 7.1 Unit Tests

Update test to support both providers:

```typescript
// src/services/transcription/__tests__/google-speech-provider.test.ts
describe('GoogleSpeechProvider', () => {
  let provider: GoogleSpeechProvider;

  beforeEach(() => {
    provider = new GoogleSpeechProvider();
  });

  describe('initialization', () => {
    it('should initialize with valid credentials', async () => {
      await provider.initialize({
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        PROJECT_ID: 'test-project',
      });

      expect(provider.isAvailable()).toBe(true);
    });

    it('should throw error with missing credentials', async () => {
      await expect(
        provider.initialize({ PROJECT_ID: 'test' })
      ).rejects.toThrow('Missing required config');
    });
  });

  describe('transcribeRecording', () => {
    it('should transcribe audio file', async () => {
      await provider.initialize({
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        PROJECT_ID: 'test-project',
      });

      const transcript = await provider.transcribeRecording(
        'consultation-123',
        'https://example.com/audio.mp3',
        { language: 'fr-CH' }
      );

      expect(transcript).toBeDefined();
      expect(transcript.language).toBe('fr-CH');
      expect(transcript.segments.length).toBeGreaterThan(0);
    });
  });
});
```

### 7.2 Integration Tests

```bash
# Set test credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/test-key.json
export PROJECT_ID=metapharm-transcription-test

# Run tests
npm test -- google-speech
```

### 7.3 Manual Testing

```bash
# Test with sample audio
curl -X POST http://localhost:3000/transcriptions \
  -H "Content-Type: application/json" \
  -d '{
    "consultation_id": "test-123",
    "audio_url": "https://storage.googleapis.com/cloud-samples-tests/speech/brooklyn.mp3"
  }'
```

---

## Step 8: Monitoring

### 8.1 Application Metrics

```typescript
// Add metrics to provider
import { Counter, Histogram } from 'prom-client';

const transcriptionCounter = new Counter({
  name: 'transcription_requests_total',
  help: 'Total transcription requests',
  labelNames: ['provider', 'status'],
});

const transcriptionDuration = new Histogram({
  name: 'transcription_duration_seconds',
  help: 'Transcription duration in seconds',
  labelNames: ['provider'],
});
```

### 8.2 Google Cloud Monitoring

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Transcription Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

---

## Step 9: Deployment

### 9.1 Build Image

```bash
cd backend/services/teleconsultation-service

# Build production image
docker build -t metapharm/teleconsultation:v1.0.0 .

# Tag latest
docker tag metapharm/teleconsultation:v1.0.0 metapharm/teleconsultation:latest

# Push to registry
docker push metapharm/teleconsultation:v1.0.0
docker push metapharm/teleconsultation:latest
```

### 9.2 Deploy to Kubernetes

```yaml
# k8s/teleconsultation-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: teleconsultation-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: teleconsultation
  template:
    metadata:
      labels:
        app: teleconsultation
    spec:
      containers:
      - name: teleconsultation
        image: metapharm/teleconsultation:v1.0.0
        env:
        - name: NODE_ENV
          value: "production"
        - name: GOOGLE_APPLICATION_CREDENTIALS
          value: "/secrets/transcription-key.json"
        - name: PROJECT_ID
          valueFrom:
            secretKeyRef:
              name: google-cloud-config
              key: project-id
        - name: TRANSCRIPT_ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: encryption-keys
              key: transcript-key
        volumeMounts:
        - name: google-credentials
          mountPath: /secrets
          readOnly: true
      volumes:
      - name: google-credentials
        secret:
          secretName: google-service-account
```

Deploy:

```bash
kubectl apply -f k8s/teleconsultation-deployment.yaml
```

---

## Troubleshooting

### Issue: "Provider not initialized"

**Solution:**
```bash
# Verify credentials file exists
ls -l $GOOGLE_APPLICATION_CREDENTIALS

# Test credentials
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
gcloud projects list
```

### Issue: Low transcription accuracy

**Solution:**
1. Add more medical terms to phrase hints
2. Ensure audio quality (16kHz, LINEAR16)
3. Use `fr-CH` for Swiss French
4. Enable enhanced model

### Issue: Speaker diarization not working

**Solution:**
1. Ensure `enable_speaker_diarization: true`
2. Set `diarizationSpeakerCount: 2`
3. Verify audio has distinct speakers
4. Check audio channel configuration

---

## Cost Estimation

### Google Cloud Speech-to-Text Pricing (as of 2024)

- Standard model: $0.006/15 seconds = $0.024/minute
- Enhanced model: $0.009/15 seconds = $0.036/minute
- Medical conversation model: $0.012/15 seconds = $0.048/minute

**Estimated monthly cost for 1000 consultations:**
- Average consultation: 15 minutes
- Total minutes: 15,000
- Cost: 15,000 × $0.048 = **$720/month**

**Free tier:** 60 minutes/month

---

## Next Steps

1. ✅ Complete Google Cloud setup
2. ✅ Implement production provider
3. ✅ Configure environment variables
4. ⏳ Test with real audio samples
5. ⏳ Performance benchmarking
6. ⏳ HIPAA BAA with Google Cloud
7. ⏳ Production deployment

---

## Support

- **Google Cloud Documentation:** https://cloud.google.com/speech-to-text/docs
- **Medical Conversation Model:** https://cloud.google.com/speech-to-text/docs/medical-model
- **French Language Support:** https://cloud.google.com/speech-to-text/docs/languages

---

**Last Updated:** 2025-11-27
**Version:** 1.0.0
