/**
 * AWS Textract Integration
 * OCR service for prescription image text extraction
 * FR-077: AI-powered OCR with confidence scoring
 */

import { TextractClient, DetectDocumentTextCommand, Block } from '@aws-sdk/client-textract';

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

export interface TextractLine {
  text: string;
  confidence: number; // 0-1 scale
}

export interface TextractResult {
  fullText: string;
  lines: TextractLine[];
  rawBlocks: Block[];
}

// ============================================================================
// OCR Function
// ============================================================================

/**
 * Extract text from prescription image using AWS Textract
 * @param imageUrl - S3 URL of prescription image
 * @returns Extracted text with confidence scores
 */
export async function extractTextFromPrescription(imageUrl: string): Promise<TextractResult> {
  try {
    // ========================================================================
    // Parse S3 URL to get bucket and key
    // ========================================================================

    const url = new URL(imageUrl);
    const bucket = url.hostname.split('.')[0]; // Extract bucket from hostname
    const key = url.pathname.substring(1); // Remove leading /

    console.log('[Textract] Processing:', { bucket, key });

    // ========================================================================
    // Call AWS Textract
    // ========================================================================

    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
    });

    const response = await textractClient.send(command);

    if (!response.Blocks || response.Blocks.length === 0) {
      throw new Error('No text detected in image');
    }

    // ========================================================================
    // Process Textract Response
    // ========================================================================

    const lines: TextractLine[] = [];
    let fullText = '';

    for (const block of response.Blocks) {
      // Extract LINE blocks (contain actual text content)
      if (block.BlockType === 'LINE' && block.Text) {
        const confidence = (block.Confidence || 0) / 100; // Convert 0-100 to 0-1

        lines.push({
          text: block.Text,
          confidence,
        });

        fullText += block.Text + '\n';
      }
    }

    console.log('[Textract] ✓ Extracted', lines.length, 'lines');

    return {
      fullText: fullText.trim(),
      lines,
      rawBlocks: response.Blocks,
    };
  } catch (error: any) {
    console.error('[Textract] ✗ OCR failed:', error.message);

    // Handle specific AWS errors
    if (error.name === 'InvalidS3ObjectException') {
      throw new Error('Prescription image not found in S3');
    }
    if (error.name === 'InvalidParameterException') {
      throw new Error('Invalid image format for OCR');
    }

    throw new Error(`Textract OCR failed: ${error.message}`);
  }
}
