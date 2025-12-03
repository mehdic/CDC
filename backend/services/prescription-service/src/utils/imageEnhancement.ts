/**
 * Image Enhancement Utilities
 * T5-025: Implement prescription image enhancement
 *
 * Features:
 * - Auto-crop and rotate prescription images
 * - Enhance contrast and sharpness
 * - Remove noise and artifacts
 * - Pre-process for optimal OCR
 * - Handle poor quality images
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import sharp from 'sharp';

// ============================================================================
// S3 Client Configuration
// ============================================================================

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ============================================================================
// Types
// ============================================================================

export interface ImageEnhancementOptions {
  autoCrop?: boolean; // Remove white borders
  autoRotate?: boolean; // Fix orientation
  enhanceContrast?: boolean; // Improve text clarity
  denoiseImage?: boolean; // Remove compression artifacts
  sharpen?: boolean; // Enhance edges
  binarize?: boolean; // Convert to black/white for text
  targetDPI?: number; // Upscale to target DPI (default: 300)
}

export interface EnhancementResult {
  enhancedImageUrl: string;
  originalSize: number;
  enhancedSize: number;
  enhancementsApplied: string[];
  metadata: {
    width: number;
    height: number;
    format: string;
    colorSpace: string;
  };
}

// ============================================================================
// Main Enhancement Function
// ============================================================================

/**
 * Enhance prescription image for optimal OCR
 * @param imageUrl - S3 URL of original image
 * @param options - Enhancement options
 * @returns S3 URL of enhanced image
 */
export async function enhancePrescriptionImage(
  imageUrl: string,
  options: ImageEnhancementOptions = {}
): Promise<string> {
  try {
    console.log('[Image Enhancement] Processing:', imageUrl);

    // ========================================================================
    // Step 1: Parse S3 URL
    // ========================================================================

    const url = new URL(imageUrl);
    const bucket = url.hostname.split('.')[0];
    const key = url.pathname.substring(1);

    // ========================================================================
    // Step 2: Download Image from S3
    // ========================================================================

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(getCommand);

    if (!response.Body) {
      throw new Error('Failed to download image from S3');
    }

    // Convert stream to buffer
    const imageBuffer = await streamToBuffer(response.Body as Readable);
    console.log('[Image Enhancement] ✓ Downloaded:', imageBuffer.length, 'bytes');

    // ========================================================================
    // Step 3: Apply Enhancements
    // ========================================================================

    const enhancementsApplied: string[] = [];
    let enhancedImage = sharp(imageBuffer);

    // Get original metadata
    const metadata = await sharp(imageBuffer).metadata();
    console.log('[Image Enhancement] Original:', metadata.width, 'x', metadata.height, metadata.format);

    // Auto-rotate based on EXIF orientation
    if (options.autoRotate !== false) {
      enhancedImage = enhancedImage.rotate(); // Auto-rotate based on EXIF
      enhancementsApplied.push('auto-rotate');
    }

    // Enhance contrast (improves text readability)
    if (options.enhanceContrast !== false) {
      enhancedImage = enhancedImage.normalize(); // Auto-level contrast
      enhancementsApplied.push('contrast-enhancement');
    }

    // Sharpen image (improves edge detection for text)
    if (options.sharpen !== false) {
      enhancedImage = enhancedImage.sharpen(1.5, 1.0, 2.0); // sigma, flat, jagged
      enhancementsApplied.push('sharpening');
    }

    // Denoise (remove JPEG compression artifacts)
    if (options.denoiseImage !== false) {
      // Median filter for noise reduction (using blur + sharpen combination)
      enhancedImage = enhancedImage.median(3); // 3x3 median filter
      enhancementsApplied.push('denoising');
    }

    // Binarize (convert to black/white for text-heavy documents)
    if (options.binarize === true) {
      enhancedImage = enhancedImage
        .grayscale()
        .normalise() // Stretch contrast
        .threshold(128); // Binary threshold
      enhancementsApplied.push('binarization');
    }

    // Upscale to target DPI if needed (300 DPI optimal for OCR)
    const targetDPI = options.targetDPI || 300;
    if (metadata.width && metadata.width < 2000) {
      const scaleFactor = 2000 / metadata.width;
      enhancedImage = enhancedImage.resize({
        width: Math.round(metadata.width * scaleFactor),
        height: metadata.height ? Math.round(metadata.height * scaleFactor) : undefined,
        kernel: sharp.kernel.lanczos3, // High-quality resampling
      });
      enhancementsApplied.push(`upscaling-${scaleFactor.toFixed(1)}x`);
    }

    // Auto-crop white borders (common in scanned documents)
    if (options.autoCrop !== false) {
      enhancedImage = enhancedImage.trim({
        threshold: 10, // Trim pixels within 10 units of white
      });
      enhancementsApplied.push('auto-crop');
    }

    // Convert to PNG for lossless quality (OCR prefers PNG)
    enhancedImage = enhancedImage.png({
      compressionLevel: 6, // Balance between size and speed
      adaptiveFiltering: true,
    });

    // ========================================================================
    // Step 4: Export Enhanced Image
    // ========================================================================

    const enhancedBuffer = await enhancedImage.toBuffer();
    const enhancedMetadata = await sharp(enhancedBuffer).metadata();

    console.log('[Image Enhancement] ✓ Enhanced:', {
      size: `${imageBuffer.length} → ${enhancedBuffer.length} bytes`,
      dimensions: `${metadata.width}x${metadata.height} → ${enhancedMetadata.width}x${enhancedMetadata.height}`,
      enhancements: enhancementsApplied.join(', '),
    });

    // ========================================================================
    // Step 5: Upload Enhanced Image to S3
    // ========================================================================

    const enhancedKey = key.replace(/(\.[^.]+)$/, '-enhanced$1').replace(/\.[^.]+$/, '.png');

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: enhancedKey,
      Body: enhancedBuffer,
      ContentType: 'image/png',
      Metadata: {
        'original-key': key,
        'enhancements': enhancementsApplied.join(','),
        'original-size': imageBuffer.length.toString(),
        'enhanced-size': enhancedBuffer.length.toString(),
      },
    });

    await s3Client.send(putCommand);

    const enhancedUrl = `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${enhancedKey}`;

    console.log('[Image Enhancement] ✓ Uploaded:', enhancedUrl);

    return enhancedUrl;
  } catch (error: any) {
    console.error('[Image Enhancement] ✗ Failed:', error.message);
    throw new Error(`Image enhancement failed: ${error.message}`);
  }
}

// ============================================================================
// Advanced Enhancement Function (for very poor quality images)
// ============================================================================

/**
 * Apply aggressive enhancements for poor quality images
 * Use this when initial OCR fails or confidence is very low
 */
export async function enhancePoorQualityImage(imageUrl: string): Promise<string> {
  return enhancePrescriptionImage(imageUrl, {
    autoCrop: true,
    autoRotate: true,
    enhanceContrast: true,
    denoiseImage: true,
    sharpen: true,
    binarize: true, // Aggressive: convert to pure B&W
    targetDPI: 300,
  });
}

// ============================================================================
// Batch Enhancement Function
// ============================================================================

/**
 * Enhance multiple prescription images in parallel
 */
export async function enhanceMultiplePrescriptions(
  imageUrls: string[],
  options: ImageEnhancementOptions = {}
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const promises = imageUrls.map(async (url) => {
    try {
      const enhancedUrl = await enhancePrescriptionImage(url, options);
      results.set(url, enhancedUrl);
    } catch (error: any) {
      console.error('[Batch Enhancement] Failed for', url, ':', error.message);
      results.set(url, url); // Fallback to original on error
    }
  });

  await Promise.all(promises);

  return results;
}

// ============================================================================
// Image Quality Assessment
// ============================================================================

/**
 * Assess image quality before OCR
 * Returns quality score and recommendations
 */
export async function assessImageQuality(imageUrl: string): Promise<{
  qualityScore: number; // 0-100
  issues: string[];
  recommendations: string[];
}> {
  try {
    // Download image
    const url = new URL(imageUrl);
    const bucket = url.hostname.split('.')[0];
    const key = url.pathname.substring(1);

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(getCommand);
    if (!response.Body) {
      throw new Error('Failed to download image');
    }

    const imageBuffer = await streamToBuffer(response.Body as Readable);
    const metadata = await sharp(imageBuffer).metadata();
    const stats = await sharp(imageBuffer).stats();

    const issues: string[] = [];
    const recommendations: string[] = [];
    let qualityScore = 100;

    // Check resolution (OCR needs at least 150 DPI, optimal is 300 DPI)
    if (metadata.width && metadata.width < 1000) {
      issues.push('Low resolution');
      recommendations.push('Enable upscaling to improve OCR accuracy');
      qualityScore -= 20;
    }

    // Check if image is too dark or too bright
    const avgBrightness = stats.channels[0].mean;
    if (avgBrightness < 50) {
      issues.push('Image too dark');
      recommendations.push('Enable contrast enhancement');
      qualityScore -= 15;
    } else if (avgBrightness > 200) {
      issues.push('Image too bright/washed out');
      recommendations.push('Enable contrast enhancement');
      qualityScore -= 15;
    }

    // Check contrast (low contrast = hard to read)
    const contrast = stats.channels[0].stdev;
    if (contrast < 30) {
      issues.push('Low contrast');
      recommendations.push('Enable contrast enhancement and sharpening');
      qualityScore -= 20;
    }

    // Check format (JPEG may have compression artifacts)
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      issues.push('JPEG compression artifacts possible');
      recommendations.push('Enable denoising');
      qualityScore -= 5;
    }

    return {
      qualityScore: Math.max(0, qualityScore),
      issues,
      recommendations,
    };
  } catch (error: any) {
    console.error('[Quality Assessment] Failed:', error.message);
    return {
      qualityScore: 0,
      issues: ['Failed to assess image quality'],
      recommendations: ['Try uploading image again'],
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Readable stream to Buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Check if image enhancement is available (sharp library installed)
 */
export function isEnhancementAvailable(): boolean {
  try {
    require('sharp');
    return true;
  } catch {
    return false;
  }
}
