import express from 'express';
import multer from 'multer';
import {
  uploadPhotos,
  getPhotos,
  deletePhoto,
  updatePhotoOrder,
} from '../controllers/photoController';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /pharmacy/photos/upload - Upload photos
router.post('/upload', upload.array('photos', 10), uploadPhotos);

// GET /pharmacy/photos - Get all photos
router.get('/', getPhotos);

// DELETE /pharmacy/photos/:photoId - Delete a photo
router.delete('/:photoId', deletePhoto);

// PUT /pharmacy/photos/order - Update photo display order
router.put('/order', updatePhotoOrder);

export default router;
