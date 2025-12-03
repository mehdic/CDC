/**
 * Enhanced OCR Service
 * T5-024: Improve OCR handwriting recognition for prescriptions
 * T5-025: Implement prescription image enhancement
 *
 * Features:
 * - Enhanced handwriting recognition
 * - Confidence scoring with field-level granularity
 * - Swiss prescription format support
 * - Image pre-processing for optimal OCR
 * - Poor quality image handling
 */

import { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand, Block } from '@aws-sdk/client-textract';
import { enhancePrescriptionImage, ImageEnhancementOptions } from '../utils/imageEnhancement';

// ============================================================================
// Textract Client Configuration
// ============================================================================

const textractClient = new TextractClient({
  region: process.env.AWS_TEXTRACT_REGION || process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ============================================================================
// Types
// ============================================================================

export interface OCRLine {
  text: string;
  confidence: number; // 0-1 scale
  isHandwritten: boolean; // Detected handwriting
  boundingBox?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface OCRWord {
  text: string;
  confidence: number;
  isHandwritten: boolean;
}

export interface SwissPrescriptionFormat {
  detected: boolean;
  format: 'Swiss-Standard' | 'Swiss-Electronic' | 'Swiss-Handwritten' | 'Unknown';
  elements: {
    doctorInfo?: string;
    patientInfo?: string;
    medicationSection?: boolean;
    signature?: boolean;
    date?: string;
  };
}

export interface EnhancedOCRResult {
  fullText: string;
  lines: OCRLine[];
  words: OCRWord[];
  rawBlocks: Block[];
  overallConfidence: number; // Average confidence 0-1
  handwrittenPercentage: number; // % of text that's handwritten
  swissFormat: SwissPrescriptionFormat;
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[]; // Quality warnings
}

// ============================================================================
// Enhanced OCR Function with Handwriting Recognition
// ============================================================================

/**
 * Extract text from prescription image with enhanced handwriting recognition
 * Uses AWS Textract ANALYZE_DOCUMENT for better handwriting support
 * @param imageUrl - S3 URL of prescription image
 * @param options - Enhancement options
 * @returns Enhanced OCR result with confidence scores and format detection
 */
export async function extractTextWithHandwritingRecognition(
  imageUrl: string,
  options: { enhanceImage?: boolean; strictMode?: boolean } = {}
): Promise<EnhancedOCRResult> {
  try {
    console.log('[Enhanced OCR] Processing prescription:', imageUrl);

    // ========================================================================
    // Step 1: Pre-process Image (if enabled)
    // ========================================================================

    let processedImageUrl = imageUrl;

    if (options.enhanceImage !== false) {
      // Image enhancement is enabled by default
      try {
        processedImageUrl = await enhancePrescriptionImage(imageUrl, {
          autoCrop: true,
          autoRotate: true,
          enhanceContrast: true,
          denoiseImage: true,
        });
        console.log('[Enhanced OCR] ✓ Image pre-processed');
      } catch (enhanceError: any) {
        console.warn('[Enhanced OCR] Image enhancement failed, using original:', enhanceError.message);
        // Continue with original image
      }
    }

    // ========================================================================
    // Step 2: Parse S3 URL
    // ========================================================================

    const url = new URL(processedImageUrl);
    const bucket = url.hostname.split('.')[0];
    const key = url.pathname.substring(1);

    // ========================================================================
    // Step 3: Call AWS Textract with ANALYZE_DOCUMENT for handwriting
    // ========================================================================

    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
      FeatureTypes: ['FORMS'], // Detect key-value pairs (doctor name, patient info)
    });

    const response = await textractClient.send(command);

    if (!response.Blocks || response.Blocks.length === 0) {
      throw new Error('No text detected in image');
    }

    // ========================================================================
    // Step 4: Process Blocks and Identify Handwriting
    // ========================================================================

    const lines: OCRLine[] = [];
    const words: OCRWord[] = [];
    let fullText = '';
    let totalConfidence = 0;
    let handwrittenCount = 0;
    let totalCount = 0;

    for (const block of response.Blocks) {
      // Process LINE blocks
      if (block.BlockType === 'LINE' && block.Text) {
        const confidence = (block.Confidence || 0) / 100;
        const isHandwritten = detectHandwriting(block, confidence);

        lines.push({
          text: block.Text,
          confidence,
          isHandwritten,
          boundingBox: block.Geometry?.BoundingBox
            ? {
                left: block.Geometry.BoundingBox.Left || 0,
                top: block.Geometry.BoundingBox.Top || 0,
                width: block.Geometry.BoundingBox.Width || 0,
                height: block.Geometry.BoundingBox.Height || 0,
              }
            : undefined,
        });

        fullText += block.Text + '\n';
        totalConfidence += confidence;
        totalCount++;

        if (isHandwritten) {
          handwrittenCount++;
        }
      }

      // Process WORD blocks for granular confidence
      if (block.BlockType === 'WORD' && block.Text) {
        const confidence = (block.Confidence || 0) / 100;
        const isHandwritten = detectHandwriting(block, confidence);

        words.push({
          text: block.Text,
          confidence,
          isHandwritten,
        });
      }
    }

    // ========================================================================
    // Step 5: Calculate Metrics
    // ========================================================================

    const overallConfidence = totalCount > 0 ? totalConfidence / totalCount : 0;
    const handwrittenPercentage = totalCount > 0 ? (handwrittenCount / totalCount) * 100 : 0;

    // ========================================================================
    // Step 6: Detect Swiss Prescription Format
    // ========================================================================

    const swissFormat = detectSwissPrescriptionFormat(fullText, lines);

    // ========================================================================
    // Step 7: Assess Image Quality
    // ========================================================================

    const { imageQuality, warnings } = assessImageQuality(
      overallConfidence,
      handwrittenPercentage,
      lines.length,
      swissFormat
    );

    console.log('[Enhanced OCR] ✓ Completed:', {
      lines: lines.length,
      words: words.length,
      confidence: `${(overallConfidence * 100).toFixed(1)}%`,
      handwritten: `${handwrittenPercentage.toFixed(1)}%`,
      quality: imageQuality,
      format: swissFormat.format,
    });

    return {
      fullText: fullText.trim(),
      lines,
      words,
      rawBlocks: response.Blocks,
      overallConfidence,
      handwrittenPercentage,
      swissFormat,
      imageQuality,
      warnings,
    };
  } catch (error: any) {
    console.error('[Enhanced OCR] ✗ Failed:', error.message);

    // Handle specific AWS errors
    if (error.name === 'InvalidS3ObjectException') {
      throw new Error('Prescription image not found in S3');
    }
    if (error.name === 'InvalidParameterException') {
      throw new Error('Invalid image format for OCR');
    }
    if (error.name === 'ProvisionedThroughputExceededException') {
      throw new Error('OCR service temporarily unavailable, please retry');
    }

    throw new Error(`Enhanced OCR failed: ${error.message}`);
  }
}

// ============================================================================
// Helper: Detect Handwriting
// ============================================================================

/**
 * Detect if text block is likely handwritten based on confidence and patterns
 * Heuristics:
 * - Low confidence (<70%) often indicates handwriting
 * - Textract doesn't explicitly flag handwriting, so we use confidence + text analysis
 */
function detectHandwriting(block: Block, confidence: number): boolean {
  // Textract confidence for printed text is typically >90%
  // Handwriting typically scores 50-80%
  if (confidence < 0.7) {
    return true; // Likely handwritten
  }

  // Check for handwriting indicators in text
  if (block.Text) {
    const text = block.Text;

    // Irregular spacing or single characters (common in poor handwriting OCR)
    if (text.length === 1 && confidence < 0.85) {
      return true;
    }

    // Very low confidence with mixed case (handwriting often misrecognized)
    if (confidence < 0.75 && /[a-z]/.test(text) && /[A-Z]/.test(text) && text.length < 10) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Helper: Detect Swiss Prescription Format
// ============================================================================

/**
 * Detect if prescription follows Swiss format conventions
 * Swiss prescriptions typically include:
 * - Doctor info (name, address, GLN number)
 * - Patient info (name, birthdate, address)
 * - "Rp" or "Rp." (Recipe indicator)
 * - Medication section
 * - Date and signature
 */
function detectSwissPrescriptionFormat(fullText: string, lines: OCRLine[]): SwissPrescriptionFormat {
  const text = fullText.toLowerCase();
  const format: SwissPrescriptionFormat = {
    detected: false,
    format: 'Unknown',
    elements: {},
  };

  // Swiss indicators
  const hasSwissRecipeIndicator = /\brp\.?|\brecipe\b/i.test(fullText);
  const hasGLNNumber = /\bgln\b.*?\d{13}/i.test(fullText); // Swiss doctor registration
  const hasSwissAddress = /\b(ch-\d{4}|\d{4}\s+(genève|zürich|bern|basel|lausanne))/i.test(text);
  const hasSwissDateFormat = /\d{1,2}\.\d{1,2}\.\d{2,4}/i.test(fullText); // DD.MM.YYYY
  const hasSwissLanguage =
    /\b(rue|strasse|via|patient|médecin|arzt|medico|pharmacie|apotheke|farmacia)\b/i.test(text);

  // Detect format type
  if (hasSwissRecipeIndicator || hasGLNNumber || (hasSwissAddress && hasSwissLanguage)) {
    format.detected = true;

    // Determine if electronic or handwritten
    const avgConfidence = lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length;
    const handwrittenLines = lines.filter((l) => l.isHandwritten).length;

    if (avgConfidence > 0.85 && handwrittenLines < lines.length * 0.2) {
      format.format = 'Swiss-Electronic';
    } else if (handwrittenLines > lines.length * 0.5) {
      format.format = 'Swiss-Handwritten';
    } else {
      format.format = 'Swiss-Standard';
    }
  }

  // Detect structural elements
  format.elements.medicationSection = hasSwissRecipeIndicator;
  format.elements.signature = /\b(signature|unterschrift|firma)\b/i.test(text);

  // Extract date if Swiss format detected
  if (hasSwissDateFormat) {
    const dateMatch = fullText.match(/\d{1,2}\.\d{1,2}\.\d{2,4}/);
    if (dateMatch) {
      format.elements.date = dateMatch[0];
    }
  }

  // Extract doctor/patient info (basic detection)
  const doctorMatch = fullText.match(/(?:dr\.?|médecin|arzt)\s+([a-z\s]+)/i);
  if (doctorMatch) {
    format.elements.doctorInfo = doctorMatch[1].trim();
  }

  const patientMatch = fullText.match(/(?:patient|nom|name):\s*([a-z\s]+)/i);
  if (patientMatch) {
    format.elements.patientInfo = patientMatch[1].trim();
  }

  return format;
}

// ============================================================================
// Helper: Assess Image Quality
// ============================================================================

/**
 * Assess image quality based on OCR confidence and content analysis
 */
function assessImageQuality(
  confidence: number,
  handwrittenPercentage: number,
  lineCount: number,
  swissFormat: SwissPrescriptionFormat
): { imageQuality: 'excellent' | 'good' | 'fair' | 'poor'; warnings: string[] } {
  const warnings: string[] = [];

  // Quality assessment
  let imageQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

  if (confidence < 0.5) {
    imageQuality = 'poor';
    warnings.push('Very low OCR confidence - image may be blurry or poor quality');
  } else if (confidence < 0.7) {
    imageQuality = 'fair';
    warnings.push('Low OCR confidence - consider manual verification');
  } else if (confidence < 0.85) {
    imageQuality = 'good';
  }

  // Handwriting warnings
  if (handwrittenPercentage > 80) {
    warnings.push('Prescription is mostly handwritten - manual review recommended');
  } else if (handwrittenPercentage > 50) {
    warnings.push('Prescription contains significant handwriting - verify critical fields');
  }

  // Content warnings
  if (lineCount < 3) {
    warnings.push('Very few lines detected - prescription may be incomplete or image cropped');
  }

  if (!swissFormat.detected) {
    warnings.push('Swiss prescription format not detected - verify prescription validity');
  }

  return { imageQuality, warnings };
}

// ============================================================================
// Backward Compatibility: Simple OCR (for migration)
// ============================================================================

/**
 * Simple OCR extraction (backward compatible with existing textract.ts)
 * Use extractTextWithHandwritingRecognition for enhanced features
 */
export async function extractTextFromPrescription(imageUrl: string): Promise<{
  fullText: string;
  lines: { text: string; confidence: number }[];
  rawBlocks: Block[];
}> {
  const result = await extractTextWithHandwritingRecognition(imageUrl, { enhanceImage: false });

  return {
    fullText: result.fullText,
    lines: result.lines.map((l) => ({ text: l.text, confidence: l.confidence })),
    rawBlocks: result.rawBlocks,
  };
}
