/**
 * Marketing Routes
 * API endpoints for campaigns, promotions, and templates
 */

import { Router } from 'express';
import { MarketingController } from '../controllers/marketing.controller';
import { CampaignService } from '../services/campaign.service';
import { PromotionService } from '../services/promotion.service';
import { TemplateService } from '../services/template.service';
import { AnalyticsService } from '../services/analytics.service';

const router = Router();

// Initialize services and controller
const campaignService = new CampaignService();
const promotionService = new PromotionService();
const templateService = new TemplateService();
const analyticsService = new AnalyticsService();

const controller = new MarketingController(
  campaignService,
  promotionService,
  templateService,
  analyticsService,
);

// ============================================================================
// Campaign Routes
// ============================================================================

// POST /pharmacies/:pharmacyId/campaigns
router.post('/pharmacies/:pharmacyId/campaigns', (req, res) =>
  controller.createCampaign(req, res),
);

// GET /campaigns/:campaignId
router.get('/campaigns/:campaignId', (req, res) =>
  controller.getCampaign(req, res),
);

// GET /pharmacies/:pharmacyId/campaigns
router.get('/pharmacies/:pharmacyId/campaigns', (req, res) =>
  controller.getCampaigns(req, res),
);

// PUT /campaigns/:campaignId
router.put('/campaigns/:campaignId', (req, res) =>
  controller.updateCampaign(req, res),
);

// DELETE /campaigns/:campaignId
router.delete('/campaigns/:campaignId', (req, res) =>
  controller.deleteCampaign(req, res),
);

// POST /campaigns/:campaignId/execute
router.post('/campaigns/:campaignId/execute', (req, res) =>
  controller.executeCampaign(req, res),
);

// GET /campaigns/:campaignId/analytics
router.get('/campaigns/:campaignId/analytics', (req, res) =>
  controller.getCampaignAnalytics(req, res),
);

// ============================================================================
// Promotion Routes
// ============================================================================

// POST /pharmacies/:pharmacyId/promotions
router.post('/pharmacies/:pharmacyId/promotions', (req, res) =>
  controller.createPromotion(req, res),
);

// GET /promotions/:promotionId
router.get('/promotions/:promotionId', (req, res) =>
  controller.getPromotion(req, res),
);

// GET /pharmacies/:pharmacyId/promotions
router.get('/pharmacies/:pharmacyId/promotions', (req, res) =>
  controller.getPromotions(req, res),
);

// POST /promotions/validate/:code
router.post('/promotions/validate/:code', (req, res) =>
  controller.validatePromoCode(req, res),
);

// PUT /promotions/:promotionId
router.put('/promotions/:promotionId', (req, res) =>
  controller.updatePromotion(req, res),
);

// DELETE /promotions/:promotionId
router.delete('/promotions/:promotionId', (req, res) =>
  controller.deletePromotion(req, res),
);

// ============================================================================
// Template Routes
// ============================================================================

// POST /pharmacies/:pharmacyId/templates
router.post('/pharmacies/:pharmacyId/templates', (req, res) =>
  controller.createTemplate(req, res),
);

// GET /templates/:templateId
router.get('/templates/:templateId', (req, res) =>
  controller.getTemplate(req, res),
);

// GET /pharmacies/:pharmacyId/templates
router.get('/pharmacies/:pharmacyId/templates', (req, res) =>
  controller.getTemplates(req, res),
);

// PUT /templates/:templateId
router.put('/templates/:templateId', (req, res) =>
  controller.updateTemplate(req, res),
);

// POST /templates/:templateId/render
router.post('/templates/:templateId/render', (req, res) =>
  controller.renderTemplate(req, res),
);

// DELETE /templates/:templateId
router.delete('/templates/:templateId', (req, res) =>
  controller.deleteTemplate(req, res),
);

export default router;
