import express from 'express';
import {
  getOperatingHours,
  setOperatingHours,
  updateOperatingHoursForDay,
} from '../controllers/hoursController';

const router = express.Router();

// GET /pharmacy/page/hours - Get operating hours
router.get('/', getOperatingHours);

// POST /pharmacy/page/hours - Set all operating hours
router.post('/', setOperatingHours);

// PUT /pharmacy/page/hours/day - Update hours for specific day
router.put('/day', updateOperatingHoursForDay);

export default router;
