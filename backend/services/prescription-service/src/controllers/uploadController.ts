/**
 * Upload Controller
 * Handles prescription image upload to S3 and database record creation
 * FR-021 to FR-025: Prescription upload workflow
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Prescription, PrescriptionSource, PrescriptionStatus } from '../../../../shared/models/Prescription';
import { uploadToS3, generateS3Key } from '../services/s3.service';

// ============================================================================
// Types
// ============================================================================

interface UploadRequestBody {
  patient_id: string;
  uploaded_by_type: 'patient' | 'doctor' | 'nurse';
  uploaded_by_id: string;
  pharmacy_id?: string; // Optional, can be inferred from uploaded_by
}

// ============================================================================
// Upload Prescription Handler
// ============================================================================

/**
 * POST /prescriptions
 * Upload prescription image and create pending prescription record
 */
export async function uploadPrescription(req: Request, res: Response): Promise<void> {
  try {
    const { patient_id, uploaded_by_type, uploaded_by_id, pharmacy_id } = req.body as UploadRequestBody;
    const file = req.file;

    // ========================================================================
    // Validation
    // ========================================================================

    if (!file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    if (!patient_id || !uploaded_by_type || !uploaded_by_id) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['patient_id', 'uploaded_by_type', 'uploaded_by_id'],
      });
      return;
    }

    // Validate uploaded_by_type
    const validTypes = ['patient', 'doctor', 'nurse'];
    if (!validTypes.includes(uploaded_by_type)) {
      res.status(400).json({
        error: 'Invalid uploaded_by_type',
        allowed: validTypes,
      });
      return;
    }

    // ========================================================================
    // Upload to S3
    // ========================================================================

    const fileExtension = file.mimetype.split('/')[1]; // jpeg, png, pdf
    const s3Key = generateS3Key(patient_id, uuidv4(), fileExtension);

    let imageUrl: string;
    try {
      imageUrl = await uploadToS3(s3Key, file.buffer, file.mimetype);
    } catch (s3Error: any) {
      console.error('[Upload Controller] S3 upload failed:', s3Error.message);
      res.status(500).json({
        error: 'Failed to upload image',
        message: s3Error.message,
      });
      return;
    }

    // ========================================================================
    // Create Prescription Record
    // ========================================================================

    const dataSource = req.app.locals.dataSource;
    const prescriptionRepo = dataSource.getRepository(Prescription);

    const prescription = prescriptionRepo.create({
      patient_id,
      pharmacy_id: pharmacy_id || null, // Will be assigned during routing
      source: PrescriptionSource.PATIENT_UPLOAD,
      image_url: imageUrl,
      status: PrescriptionStatus.PENDING,
      // AI transcription will be added later via /prescriptions/:id/transcribe endpoint
      ai_transcription_data: null,
      ai_confidence_score: null,
      // Relationships (will be populated by transcription service)
      prescribing_doctor_id: null,
      pharmacist_id: null,
    });

    await prescriptionRepo.save(prescription);

    console.log('[Upload Controller] ✓ Prescription created:', prescription.id);

    // ========================================================================
    // Response
    // ========================================================================

    res.status(201).json({
      id: prescription.id,
      patient_id: prescription.patient_id,
      image_url: prescription.image_url,
      status: prescription.status,
      source: prescription.source,
      created_at: prescription.created_at,
    });
  } catch (error: any) {
    console.error('[Upload Controller] Error:', error);

    // Handle multer file size error
    if (error.message?.includes('File too large')) {
      res.status(413).json({
        error: 'File too large',
        max_size: `${process.env.MAX_FILE_SIZE_MB || 10}MB`,
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to upload prescription',
      message: error.message,
    });
  }
}
