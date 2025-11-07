/**
 * AWS S3 Service
 * Handles prescription image uploads to S3
 * Based on: FR-021 (Image upload with S3 storage)
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
// Upload Function
// ============================================================================

/**
 * Upload prescription image to S3
 * @param key - S3 object key (path/filename)
 * @param body - File buffer
 * @param contentType - MIME type (image/jpeg, image/png, application/pdf)
 * @returns S3 URL of uploaded file
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET!;

  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: 'AES256', // Encrypt at rest
  });

  try {
    await s3Client.send(command);

    // Construct S3 URL
    const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log('[S3 Service] ✓ Uploaded:', key);

    return url;
  } catch (error: any) {
    console.error('[S3 Service] ✗ Upload failed:', error.message);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

/**
 * Generate S3 key for prescription image
 * Format: prescriptions/{patient_id}/{uuid}-{timestamp}.{ext}
 */
export function generateS3Key(patientId: string, fileName: string, extension: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '');
  return `prescriptions/${patientId}/${sanitizedFileName}-${timestamp}.${extension}`;
}
