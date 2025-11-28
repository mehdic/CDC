/**
 * VIP Program Routes
 * T3-095 to T3-099: VIP program endpoints
 */

import { Router } from 'express';
import {
  getMembership,
  getMembershipSummary,
  getPointsHistory,
  earnPoints,
  redeemPoints,
  getDiscount,
  checkFreeDelivery,
  getTierThresholds,
  awardBirthdayBonus,
} from '../controllers/vipController';

const router = Router();

// ============================================================================
// Membership Endpoints
// ============================================================================

// GET /vip/membership - Get current membership with benefits
router.get('/membership', getMembership);

// GET /vip/summary - Get membership summary
router.get('/summary', getMembershipSummary);

// ============================================================================
// Points Endpoints
// ============================================================================

// GET /vip/points/history - Get points transaction history
router.get('/points/history', getPointsHistory);

// POST /vip/points/earn - Record points earned from purchase
router.post('/points/earn', earnPoints);

// POST /vip/points/redeem - Redeem points for discount
router.post('/points/redeem', redeemPoints);

// POST /vip/points/birthday - Award birthday bonus (admin)
router.post('/points/birthday', awardBirthdayBonus);

// ============================================================================
// Discount & Benefits Endpoints
// ============================================================================

// GET /vip/discount - Get applicable discount percentage
router.get('/discount', getDiscount);

// GET /vip/delivery/eligible - Check free delivery eligibility
router.get('/delivery/eligible', checkFreeDelivery);

// ============================================================================
// Tier Information Endpoints
// ============================================================================

// GET /vip/tier/thresholds - Get tier threshold information
router.get('/tier/thresholds', getTierThresholds);

export default router;
