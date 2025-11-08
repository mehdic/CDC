/**
 * AI Transcription Integration
 * Uses Twilio Speech-to-Text for consultation transcription
 * Task: T146
 */

import twilio, { Twilio } from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

let twilioClient: Twilio | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number; // 0-1
  highlighted_terms: Array<{
    term: string;
    timestamp: number; // seconds into consultation
    confidence: number;
    category?: string;
  }>;
  summary?: string;
}

/**
 * Transcribe audio from Twilio recording
 * FR-025: System MUST support AI-assisted note-taking with patient consent
 */
export async function transcribeRecording(
  recordingUrl: string
): Promise<TranscriptionResult> {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    // In production, this would:
    // 1. Download recording from Twilio
    // 2. Send to Twilio Speech-to-Text API
    // 3. Parse response and extract medical terms
    // 4. Generate summary using AI

    // For MVP, we'll return a mock transcription
    // TODO: Implement actual Twilio Speech-to-Text integration

    console.log(`[Transcription] Transcribing recording: ${recordingUrl}`);

    // Mock transcription result
    return {
      transcript:
        'Patient reported headache for 3 days. Recommended ibuprofen 400mg twice daily for 5 days. Advised to return if symptoms persist.',
      confidence: 0.92,
      highlighted_terms: [
        {
          term: 'headache',
          timestamp: 15,
          confidence: 0.95,
          category: 'symptom',
        },
        {
          term: 'ibuprofen',
          timestamp: 42,
          confidence: 0.98,
          category: 'medication',
        },
      ],
      summary:
        'Patient consultation for headache. Prescribed ibuprofen 400mg BID x 5 days.',
    };
  } catch (error: any) {
    console.error('[Transcription] Error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Highlight medical terms in text using AI
 * Extracts medications, symptoms, diagnoses from consultation text
 */
export function highlightMedicalTerms(text: string): Array<{
  term: string;
  category: string;
  confidence: number;
}> {
  // In production, this would use NLP/ML model to extract medical entities
  // For now, simple regex matching for demo

  const medicalTermPatterns = {
    medication: /\b(ibuprofen|paracetamol|aspirin|amoxicillin|metformin)\b/gi,
    symptom: /\b(headache|fever|cough|pain|nausea|fatigue)\b/gi,
    dosage: /\b(\d+\s?mg|\d+\s?ml)\b/gi,
  };

  const highlights: Array<{
    term: string;
    category: string;
    confidence: number;
  }> = [];

  Object.entries(medicalTermPatterns).forEach(([category, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      highlights.push({
        term: match[0],
        category,
        confidence: 0.85, // Mock confidence
      });
    }
  });

  return highlights;
}
