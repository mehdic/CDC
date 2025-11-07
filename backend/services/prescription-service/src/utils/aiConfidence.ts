/**
 * AI Confidence Scoring
 * Calculate confidence scores for prescription transcription
 * FR-013a: Low-confidence field detection and highlighting
 */

import { PrescriptionItem } from '../../../../shared/models/PrescriptionItem';

// ============================================================================
// Constants
// ============================================================================

// FR-013a: Low confidence threshold (< 70% requires pharmacist review)
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

// ============================================================================
// Prescription-Level Confidence
// ============================================================================

/**
 * Calculate overall prescription confidence from all items
 * @param items - Prescription items with confidence scores
 * @returns Average confidence across all items (0-1 scale)
 */
export function calculatePrescriptionConfidence(items: PrescriptionItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  const itemConfidences = items.map((item) => calculateItemConfidence(item));
  const avgConfidence = itemConfidences.reduce((sum, c) => sum + c, 0) / itemConfidences.length;

  return parseFloat(avgConfidence.toFixed(2));
}

// ============================================================================
// Item-Level Confidence
// ============================================================================

/**
 * Calculate average confidence for a single prescription item
 * @param item - Prescription item with field-level confidence scores
 * @returns Average confidence (0-1 scale)
 */
export function calculateItemConfidence(item: PrescriptionItem): number {
  const confidences: number[] = [];

  // Collect all non-null confidence scores
  if (item.medication_confidence !== null) {
    confidences.push(item.medication_confidence);
  }
  if (item.dosage_confidence !== null) {
    confidences.push(item.dosage_confidence);
  }
  if (item.frequency_confidence !== null) {
    confidences.push(item.frequency_confidence);
  }
  // Note: duration_confidence not in database schema yet, but parser provides it

  if (confidences.length === 0) {
    return 0;
  }

  const avg = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  return parseFloat(avg.toFixed(2));
}

// ============================================================================
// Low Confidence Detection (FR-013a)
// ============================================================================

/**
 * Identify fields with low confidence requiring pharmacist review
 * FR-013a: Fields with confidence < 70% must be highlighted with visual warnings
 * @param item - Prescription item
 * @param threshold - Confidence threshold (default 0.7)
 * @returns Array of field names with low confidence
 */
export function identifyLowConfidenceFields(
  item: PrescriptionItem,
  threshold: number = LOW_CONFIDENCE_THRESHOLD
): string[] {
  const lowConfidenceFields: string[] = [];

  if (item.medication_confidence !== null && item.medication_confidence < threshold) {
    lowConfidenceFields.push('medication_name');
  }

  if (item.dosage_confidence !== null && item.dosage_confidence < threshold) {
    lowConfidenceFields.push('dosage');
  }

  if (item.frequency_confidence !== null && item.frequency_confidence < threshold) {
    lowConfidenceFields.push('frequency');
  }

  return lowConfidenceFields;
}

/**
 * Check if prescription item has any low confidence fields
 * @param item - Prescription item
 * @param threshold - Confidence threshold (default 0.7)
 * @returns True if any field has low confidence
 */
export function hasLowConfidence(
  item: PrescriptionItem,
  threshold: number = LOW_CONFIDENCE_THRESHOLD
): boolean {
  return identifyLowConfidenceFields(item, threshold).length > 0;
}

/**
 * Determine prescription status based on overall confidence
 * FR-013a: Low-confidence prescriptions require pharmacist review
 * @param overallConfidence - Overall prescription confidence (0-1 scale)
 * @returns Status: 'transcribed' if high confidence, 'needs_review' if low
 */
export function determinePrescriptionStatus(overallConfidence: number): 'transcribed' | 'needs_review' {
  return overallConfidence >= LOW_CONFIDENCE_THRESHOLD ? 'transcribed' : 'needs_review';
}

// ============================================================================
// Confidence Score Formatting
// ============================================================================

/**
 * Convert confidence from 0-1 scale to 0-100 scale
 * @param confidence - Confidence in 0-1 scale
 * @returns Confidence as percentage (0-100)
 */
export function confidenceToPercentage(confidence: number): number {
  return Math.round(confidence * 100);
}

/**
 * Convert confidence from 0-100 scale to 0-1 scale
 * @param percentage - Confidence as percentage (0-100)
 * @returns Confidence in 0-1 scale
 */
export function percentageToConfidence(percentage: number): number {
  return parseFloat((percentage / 100).toFixed(2));
}
