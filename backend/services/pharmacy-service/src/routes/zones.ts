import express from 'express';
import {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
} from '../controllers/zonesController';

const router = express.Router();

// GET /pharmacy/page/delivery-zones - Get all delivery zones
router.get('/', getDeliveryZones);

// POST /pharmacy/page/delivery-zones - Create delivery zone
router.post('/', createDeliveryZone);

// PUT /pharmacy/page/delivery-zones/:zoneId - Update delivery zone
router.put('/:zoneId', updateDeliveryZone);

// DELETE /pharmacy/page/delivery-zones/:zoneId - Delete delivery zone
router.delete('/:zoneId', deleteDeliveryZone);

export default router;
