/**
 * Medication Parser
 * Parses medication information from Textract OCR results
 * FR-077: Extract medication names, dosages, frequency, duration with confidence scores
 */

import { TextractResult } from '../integrations/textract';

// ============================================================================
// Types
// ============================================================================

export interface ParsedMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: number | null; // Days
  name_confidence: number; // 0-1 scale
  dosage_confidence: number; // 0-1 scale
  frequency_confidence: number; // 0-1 scale
  duration_confidence: number; // 0-1 scale
}

// ============================================================================
// Regex Patterns
// ============================================================================

// Common medication name patterns (simplified - real implementation would use drug database)
const MEDICATION_PATTERNS = [
  // Generic drug suffixes
  /\b([A-Z][a-z]+(?:cin|pine|pril|sartan|ol|ide|ine|ium|mab|nib))\b/g,
  // Common medication names
  /\b(Aspirin|Ibuprofen|Paracetamol|Acetaminophen|Metformin|Amoxicillin|Atorvastatin|Lisinopril|Omeprazole|Levothyroxine|Amlodipine|Simvastatin|Losartan|Gabapentin|Hydrochlorothiazide|Metoprolol|Sertraline|Furosemide|Escitalopram|Prednisone)\b/gi,
];

// Dosage patterns
const DOSAGE_PATTERN = /(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|µg|IU|U)/gi;

// Frequency patterns (multi-language support for Swiss market)
const FREQUENCY_PATTERNS = [
  /(\d+)(?:x|\s+times|\s+fois|\s+mal)\s+(daily|par jour|täglich|per day|a day)/gi,
  /(?:once|twice|three times|four times|1x|2x|3x|4x)\s+(daily|par jour|täglich|per day)/gi,
  /(morning|evening|noon|night|matin|soir|midi|Morgen|Abend)/gi,
];

// Duration patterns (multi-language)
const DURATION_PATTERN = /(?:for|pendant|während|per|durant)\s+(\d+)\s+(days?|jours?|Tagen?|weeks?|semaines?|Wochen?|months?|mois|Monaten?)/gi;

// ============================================================================
// Parser Function
// ============================================================================

/**
 * Parse medications from Textract OCR result
 * @param textractResult - OCR result with lines and confidence scores
 * @returns Array of parsed medications with confidence scores
 */
export function parseMedications(textractResult: TextractResult): ParsedMedication[] {
  const medications: ParsedMedication[] = [];
  const lines = textractResult.lines;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text;
    const lineConfidence = line.confidence;

    // ========================================================================
    // Find Medication Name
    // ========================================================================

    let medicationName: string | null = null;
    let nameConfidence = 0;

    for (const pattern of MEDICATION_PATTERNS) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        medicationName = matches[0];
        nameConfidence = lineConfidence;
        break;
      }
    }

    if (!medicationName) {
      continue; // No medication found in this line
    }

    // ========================================================================
    // Find Dosage (look in current and next line)
    // ========================================================================

    let dosage = 'Not specified';
    let dosageConfidence = 0.3; // Low default confidence for unspecified

    for (let j = i; j < Math.min(i + 2, lines.length); j++) {
      const currentLine = lines[j];
      if (!currentLine) continue;

      const dosageMatch = currentLine.text.match(DOSAGE_PATTERN);
      if (dosageMatch && dosageMatch[0]) {
        dosage = dosageMatch[0];
        dosageConfidence = currentLine.confidence;
        break;
      }
    }

    // ========================================================================
    // Find Frequency (look in current and next line)
    // ========================================================================

    let frequency = 'Not specified';
    let frequencyConfidence = 0.3; // Low default confidence for unspecified

    for (let j = i; j < Math.min(i + 2, lines.length); j++) {
      const currentLine = lines[j];
      if (!currentLine) continue;

      for (const pattern of FREQUENCY_PATTERNS) {
        const freqMatch = currentLine.text.match(pattern);
        if (freqMatch && freqMatch[0]) {
          frequency = freqMatch[0];
          frequencyConfidence = currentLine.confidence;
          break;
        }
      }
      if (frequency !== 'Not specified') break;
    }

    // ========================================================================
    // Find Duration (look in current and next line)
    // ========================================================================

    let duration: number | null = null;
    let durationConfidence = 0.3; // Low default confidence for unspecified

    for (let j = i; j < Math.min(i + 2, lines.length); j++) {
      const currentLine = lines[j];
      if (!currentLine) continue;

      const durationMatch = currentLine.text.match(DURATION_PATTERN);
      if (durationMatch) {
        // Extract number of days/weeks/months
        const match = DURATION_PATTERN.exec(currentLine.text);
        if (match && match[1] && match[2]) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();

          // Convert to days
          if (unit.includes('week') || unit.includes('semaine') || unit.includes('woche')) {
            duration = value * 7;
          } else if (unit.includes('month') || unit.includes('mois') || unit.includes('monat')) {
            duration = value * 30;
          } else {
            duration = value; // Already in days
          }

          durationConfidence = currentLine.confidence;
          break;
        }
      }
    }

    // ========================================================================
    // Add Parsed Medication
    // ========================================================================

    medications.push({
      name: medicationName,
      dosage,
      frequency,
      duration,
      name_confidence: parseFloat(nameConfidence.toFixed(2)),
      dosage_confidence: parseFloat(dosageConfidence.toFixed(2)),
      frequency_confidence: parseFloat(frequencyConfidence.toFixed(2)),
      duration_confidence: parseFloat(durationConfidence.toFixed(2)),
    });
  }

  console.log('[Medication Parser] ✓ Parsed', medications.length, 'medications');

  return medications;
}
