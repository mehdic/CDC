/**
 * Payment Routes
 * RESTful routes for Payment CRUD operations
 * PCI-DSS compliant
 */

import { Router } from 'express';
import {
  listPayments,
  getPayment,
  createPayment,
  processPayment,
  updatePayment,
  refundPayment,
  deletePayment,
} from '../controllers/paymentController';

const router = Router();

// CRUD routes
router.get('/payments', listPayments);
router.get('/payments/:id', getPayment);
router.post('/payments', createPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

// Special routes
router.post('/payments/process', processPayment);
router.post('/payments/:id/refund', refundPayment);

export default router;
