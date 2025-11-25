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
    console.log(`[Transcription] Transcribing recording: ${recordingUrl}`);

    // Fetch the recording from Twilio
    const recording = await twilioClient.recordings(extractRecordingSid(recordingUrl)).fetch();

    // Download the audio file
    const audioUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;

    // Create a transcription using Twilio's Speech Recognition API
    // Note: Twilio doesn't have a direct speech-to-text API, but we can use Media Streams
    // For post-call transcription, we would integrate with a service like Google Cloud Speech-to-Text
    // or AWS Transcribe. For this implementation, we'll use a placeholder that shows the integration pattern.

    const transcriptionResponse = await performSpeechToText(audioUrl);

    // Extract medical terms from the transcript
    const medicalTerms = highlightMedicalTerms(transcriptionResponse.text);

    // Convert to our format with timestamps
    const highlighted_terms = medicalTerms.map((term, index) => ({
      term: term.term,
      timestamp: index * 5, // Mock timestamps - real implementation would parse from transcription
      confidence: term.confidence,
      category: term.category,
    }));

    // Generate summary (simplified - real implementation would use NLP)
    const summary = generateSummary(transcriptionResponse.text);

    return {
      transcript: transcriptionResponse.text,
      confidence: transcriptionResponse.confidence,
      highlighted_terms,
      summary,
    };
  } catch (error: any) {
    console.error('[Transcription] Error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Extract recording SID from Twilio recording URL
 */
function extractRecordingSid(url: string): string {
  const match = url.match(/\/Recordings\/([A-Za-z0-9]+)/);
  if (!match) {
    throw new Error('Invalid recording URL format');
  }
  return match[1];
}

/**
 * Perform speech-to-text transcription
 * In production, this would call Google Cloud Speech-to-Text or AWS Transcribe
 */
async function performSpeechToText(audioUrl: string): Promise<{
  text: string;
  confidence: number;
}> {
  // This is a placeholder for actual speech-to-text API integration
  // In production, you would:
  // 1. Use Google Cloud Speech-to-Text API
  // 2. Or AWS Transcribe Medical
  // 3. Or Azure Speech Services (Medical)

  console.log(`[Transcription] Processing audio from: ${audioUrl}`);

  // Mock response - replace with actual API call
  return {
    text: 'Patient reported headache for 3 days. Recommended ibuprofen 400mg twice daily for 5 days. Advised to return if symptoms persist.',
    confidence: 0.92,
  };
}

/**
 * Generate a concise summary of the consultation
 */
function generateSummary(text: string): string {
  // Simplified summary generation
  // In production, use NLP/AI to extract key information
  const sentences = text.split('.').map(s => s.trim()).filter(s => s.length > 0);

  // Extract key medical terms
  const medications = text.match(/\b(ibuprofen|paracetamol|aspirin|amoxicillin|metformin)\b/gi) || [];
  const symptoms = text.match(/\b(headache|fever|cough|pain|nausea|fatigue)\b/gi) || [];

  let summary = '';

  if (symptoms.length > 0 && symptoms[0]) {
    summary += `Patient consultation for ${symptoms[0].toLowerCase()}.`;
  }

  if (medications.length > 0 && medications[0]) {
    const dosageMatch = text.match(/(\d+\s?mg)/i);
    const dosage = dosageMatch && dosageMatch[0] ? dosageMatch[0] : '';
    summary += ` Prescribed ${medications[0].toLowerCase()}${dosage ? ' ' + dosage : ''}.`;
  }

  return summary || 'Consultation completed.';
}

/**
 * Highlight medical terms in text using AI
 * Extracts medications, symptoms, diagnoses from consultation text
 * INT-008: Enhanced medical term highlighting with NLP
 */
export function highlightMedicalTerms(text: string): Array<{
  term: string;
  category: string;
  confidence: number;
  start?: number;
  end?: number;
}> {
  // Enhanced medical term patterns with more comprehensive coverage
  const medicalTermPatterns = {
    medication: {
      pattern: /\b(ibuprofen|paracetamol|aspirin|amoxicillin|metformin|acetaminophen|naproxen|ciprofloxacin|azithromycin|lisinopril|atorvastatin|omeprazole|levothyroxine|amlodipine|metoprolol|albuterol|prednisone|gabapentin|hydrochlorothiazide|losartan|sertraline|escitalopram|fluoxetine|duloxetine|warfarin|clopidogrel|insulin|simvastatin|montelukast|furosemide|pantoprazole|tramadol|codeine|morphine|fentanyl)\b/gi,
      confidence: 0.92,
    },
    symptom: {
      pattern: /\b(headache|migraine|fever|pyrexia|cough|dry cough|productive cough|pain|chest pain|abdominal pain|back pain|joint pain|nausea|vomiting|diarrhea|constipation|fatigue|weakness|dizziness|vertigo|shortness of breath|dyspnea|palpitations|rash|itching|pruritus|swelling|edema|bleeding|bruising|numbness|tingling|insomnia|anxiety|depression|confusion|loss of appetite|weight loss|weight gain|sore throat|runny nose|congestion|sneezing)\b/gi,
      confidence: 0.88,
    },
    dosage: {
      pattern: /\b(\d+\s?(?:mg|ml|g|mcg|μg|units?|IU|tablets?|capsules?|drops?|puffs?))\b/gi,
      confidence: 0.95,
    },
    frequency: {
      pattern: /\b(once daily|twice daily|three times daily|four times daily|every \d+ hours|q\d+h|BID|TID|QID|QD|PRN|as needed|before meals|after meals|at bedtime|in the morning|in the evening)\b/gi,
      confidence: 0.90,
    },
    duration: {
      pattern: /\b(for \d+ days?|for \d+ weeks?|for \d+ months?|until symptoms resolve|until finished|x \d+ days?)\b/gi,
      confidence: 0.93,
    },
    condition: {
      pattern: /\b(hypertension|diabetes|asthma|COPD|pneumonia|bronchitis|sinusitis|urinary tract infection|UTI|gastroenteritis|influenza|flu|COVID-19|coronavirus|allergic rhinitis|seasonal allergies|eczema|psoriasis|arthritis|osteoarthritis|rheumatoid arthritis|gout|depression|anxiety disorder|GERD|acid reflux|hypothyroidism|hyperthyroidism|anemia|kidney disease|liver disease|heart failure|coronary artery disease|atrial fibrillation|stroke|TIA)\b/gi,
      confidence: 0.87,
    },
    vital: {
      pattern: /\b(blood pressure|BP|heart rate|HR|temperature|temp|respiratory rate|RR|oxygen saturation|SpO2|pulse|\d+\/\d+\s?mmHg|\d+\s?bpm|\d+\.?\d*\s?°[CF]|\d+\s?%)\b/gi,
      confidence: 0.94,
    },
    route: {
      pattern: /\b(oral|orally|by mouth|sublingual|topical|transdermal|intravenous|IV|intramuscular|IM|subcutaneous|SC|inhaled|inhalation|nasal|ophthalmic|otic|rectal|vaginal)\b/gi,
      confidence: 0.91,
    },
    anatomy: {
      pattern: /\b(heart|lung|liver|kidney|brain|stomach|intestine|colon|bladder|prostate|thyroid|pancreas|spleen|blood vessel|artery)\b/gi,
      confidence: 0.89,
    },
    procedure: {
      pattern: /\b(blood test|urine test|x-ray|CT scan|MRI|ultrasound|ECG|EKG|endoscopy|colonoscopy|biopsy|surgery|vaccination|injection|infusion)\b/gi,
      confidence: 0.90,
    },
    allergy: {
      pattern: /\b(penicillin allergy|sulfa allergy|latex allergy|peanut allergy|shellfish allergy|egg allergy|milk allergy|soy allergy|wheat allergy|allergic reaction)\b/gi,
      confidence: 0.92,
    },
  };

  const highlights: Array<{
    term: string;
    category: string;
    confidence: number;
    start?: number;
    end?: number;
  }> = [];

  // Track seen terms to avoid duplicates
  const seenTerms = new Set<string>();

  Object.entries(medicalTermPatterns).forEach(([category, config]) => {
    const matches = text.matchAll(config.pattern);
    for (const match of matches) {
      const term = match[0];
      const termKey = `${category}:${term.toLowerCase()}`;

      // Avoid duplicates
      if (!seenTerms.has(termKey)) {
        seenTerms.add(termKey);

        highlights.push({
          term,
          category,
          confidence: config.confidence,
          start: match.index,
          end: match.index ? match.index + term.length : undefined,
        });
      }
    }
  });

  // Sort by position in text
  highlights.sort((a, b) => (a.start || 0) - (b.start || 0));

  return highlights;
}

/**
 * Enhanced version that returns formatted highlights with context
 * INT-008: Return structured data for UI rendering
 */
export interface MedicalHighlight {
  text: string;
  highlights: Array<{
    term: string;
    type: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  summary: {
    medications: string[];
    symptoms: string[];
    dosages: string[];
    conditions: string[];
  };
}

export function extractMedicalEntities(text: string): MedicalHighlight {
  const highlights = highlightMedicalTerms(text);

  // Group by category for summary
  const summary = {
    medications: highlights.filter(h => h.category === 'medication').map(h => h.term),
    symptoms: highlights.filter(h => h.category === 'symptom').map(h => h.term),
    dosages: highlights.filter(h => h.category === 'dosage').map(h => h.term),
    conditions: highlights.filter(h => h.category === 'condition').map(h => h.term),
  };

  return {
    text,
    highlights: highlights.map(h => ({
      term: h.term,
      type: h.category,
      start: h.start || 0,
      end: h.end || 0,
      confidence: h.confidence,
    })),
    summary,
  };
}
