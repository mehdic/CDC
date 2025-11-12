import express from 'express';
import {
  getPharmacyProfile,
  updatePharmacyProfile,
  publishPharmacyProfile,
  unpublishPharmacyProfile,
} from '../controllers/profileController';

const router = express.Router();

// GET /pharmacy/page - Get pharmacy profile
router.get('/', getPharmacyProfile);

// PUT /pharmacy/page/update - Update pharmacy profile
router.put('/update', updatePharmacyProfile);

// POST /pharmacy/page/publish - Publish pharmacy page
router.post('/publish', publishPharmacyProfile);

// POST /pharmacy/page/unpublish - Unpublish pharmacy page
router.post('/unpublish', unpublishPharmacyProfile);

export default router;
