/**
 * Prescription Upload Routes
 * POST /prescriptions - Upload prescription image (JPG, PNG, PDF max 10MB)
 * FR-021 to FR-025: Patient prescription upload with validation
 */

import { Router } from 'express';
import multer from 'multer';
import { uploadPrescription } from '../controllers/uploadController';
import { validateBody } from '../middleware/validation.middleware';
import { UploadPrescriptionDto } from '../dto/UploadPrescriptionDto';

const router = Router();

// ============================================================================
// Multer Configuration
// ============================================================================

// Configure multer for memory storage (will upload to S3 directly from buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (
      process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf'
    ).split(',');

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, PDF'));
    }
  },
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /prescriptions
 * Upload prescription image
 *
 * Body (multipart/form-data):
 * - image: File (JPG, PNG, PDF, max 10MB)
 * - patient_id: UUID
 * - uploaded_by_type: String (patient, doctor, nurse)
 * - uploaded_by_id: UUID
 */
router.post('/', upload.single('image'), validateBody(UploadPrescriptionDto), uploadPrescription);

export default router;
