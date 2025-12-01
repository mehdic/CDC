/**
 * Marketing Controller
 * Handles HTTP requests for campaigns, promotions, and templates
 */

import { Request, Response } from 'express';
import { CampaignService } from '../services/campaign.service';
import { PromotionService } from '../services/promotion.service';
import { TemplateService } from '../services/template.service';
import { AnalyticsService } from '../services/analytics.service';
import {
  CampaignRequest,
  PromotionRequest,
  TemplateRequest,
  RenderTemplateRequest,
  ValidatePromoCodeRequest,
} from '../types/marketing.types';

export class MarketingController {
  constructor(
    private campaignService: CampaignService,
    private promotionService: PromotionService,
    private templateService: TemplateService,
    private analyticsService: AnalyticsService,
  ) {}

  // ============================================================================
  // Campaign Endpoints
  // ============================================================================

  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { pharmacyId } = req.params;
      const dto: CampaignRequest = req.body;

      const campaign = await this.campaignService.createCampaign({
        pharmacyId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        subject: dto.subject,
        content: dto.content,
        templateId: dto.templateId,
        targetAudience: dto.targetAudience,
        targetingRules: dto.targetingRules,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isRecurring: dto.isRecurring || false,
        recurringPattern: dto.recurringPattern,
        promotionId: dto.promotionId,
        aBTestConfig: dto.aBTestConfig,
        metadata: dto.metadata,
      });

      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const campaign = await this.campaignService.getCampaignById(campaignId);
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json(campaign);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const { pharmacyId } = req.params;
      const { status } = req.query;

      let campaigns;
      if (status) {
        campaigns = await this.campaignService.getCampaignsByStatus(pharmacyId, status as any);
      } else {
        campaigns = await this.campaignService.getCampaignsByPharmacy(pharmacyId);
      }

      res.json(campaigns);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get campaigns',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const dto = req.body;

      const campaign = await this.campaignService.updateCampaign(campaignId, {
        name: dto.name,
        description: dto.description,
        subject: dto.subject,
        content: dto.content,
        status: dto.status,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        targetAudience: dto.targetAudience,
        targetingRules: dto.targetingRules,
        aBTestConfig: dto.aBTestConfig,
        metadata: dto.metadata,
      });

      res.json(campaign);
    } catch (error) {
      res.status(400).json({
        error: 'Failed to update campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const deleted = await this.campaignService.deleteCampaign(campaignId);
      if (!deleted) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async executeCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const campaign = await this.campaignService.executeCampaign(campaignId);

      res.json({
        message: 'Campaign execution started',
        campaign,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to execute campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCampaignAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const metrics = await this.analyticsService.getCampaignMetrics(campaignId);

      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get campaign analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // Promotion Endpoints
  // ============================================================================

  async createPromotion(req: Request, res: Response): Promise<void> {
    try {
      const { pharmacyId } = req.params;
      const dto: PromotionRequest = req.body;

      const promotion = await this.promotionService.createPromotion({
        pharmacyId,
        name: dto.name,
        description: dto.description,
        code: dto.code,
        type: dto.type,
        startDate: new Date(dto.startDate),
        expiryDate: new Date(dto.expiryDate),
        discountValue: dto.discountValue,
        discountUnit: dto.discountUnit,
        minimumPurchaseAmount: dto.minimumPurchaseAmount,
        minimumQuantity: dto.minimumQuantity,
        applicableProductIds: dto.applicableProductIds,
        applicableCategories: dto.applicableCategories,
        applicableLocations: dto.applicableLocations,
        maxUsageCount: dto.maxUsageCount,
        maxUsagePerCustomer: dto.maxUsagePerCustomer,
        isStackable: dto.isStackable || false,
        eligibleCustomerTypes: dto.eligibleCustomerTypes,
        metadata: dto.metadata,
      });

      res.status(201).json(promotion);
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create promotion',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getPromotion(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;

      const promotion = await this.promotionService.getPromotionById(promotionId);
      if (!promotion) {
        res.status(404).json({ error: 'Promotion not found' });
        return;
      }

      res.json(promotion);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get promotion',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getPromotions(req: Request, res: Response): Promise<void> {
    try {
      const { pharmacyId } = req.params;

      const promotions = await this.promotionService.getPromotionsByPharmacy(pharmacyId);

      res.json(promotions);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get promotions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async validatePromoCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const dto: ValidatePromoCodeRequest = req.body;

      const result = await this.promotionService.validatePromotionCode(
        code,
        dto.customerId,
        dto.purchaseAmount,
        dto.productIds,
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to validate promotion code',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updatePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;
      const dto = req.body;

      const promotion = await this.promotionService.updatePromotion(promotionId, dto);

      res.json(promotion);
    } catch (error) {
      res.status(400).json({
        error: 'Failed to update promotion',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deletePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { promotionId } = req.params;

      const deleted = await this.promotionService.deletePromotion(promotionId);
      if (!deleted) {
        res.status(404).json({ error: 'Promotion not found' });
        return;
      }

      res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete promotion',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // Template Endpoints
  // ============================================================================

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { pharmacyId } = req.params;
      const dto: TemplateRequest = req.body;

      const template = await this.templateService.createTemplate({
        pharmacyId,
        name: dto.name,
        description: dto.description,
        channel: dto.channel,
        subject: dto.subject,
        body: dto.body,
        htmlContent: dto.htmlContent,
        variables: dto.variables,
        metadata: dto.metadata,
      });

      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      const template = await this.templateService.getTemplateById(templateId);
      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { pharmacyId } = req.params;

      const templates = await this.templateService.getTemplatesByPharmacy(pharmacyId);

      res.json(templates);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const dto = req.body;

      const template = await this.templateService.updateTemplate(templateId, dto);

      res.json(template);
    } catch (error) {
      res.status(400).json({
        error: 'Failed to update template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async renderTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const dto: RenderTemplateRequest = req.body;

      const template = await this.templateService.getTemplateById(templateId);
      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      const rendered = await this.templateService.renderTemplate(template, dto.variables);

      res.json(rendered);
    } catch (error) {
      res.status(400).json({
        error: 'Failed to render template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      const deleted = await this.templateService.deleteTemplate(templateId);
      if (!deleted) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
