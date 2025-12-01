/**
 * Campaign Service
 * CRUD operations for campaigns with scheduling and execution
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Campaign, CampaignStatus, CampaignType } from '../entities/Campaign';

export interface CreateCampaignDTO {
  pharmacyId: string;
  name: string;
  description?: string;
  type: CampaignType;
  subject: string;
  content: string;
  templateId?: string;
  targetAudience: string[];
  targetingRules?: any;
  scheduledAt?: Date;
  startDate?: Date;
  endDate?: Date;
  isRecurring?: boolean;
  recurringPattern?: string;
  promotionId?: string;
  aBTestConfig?: any;
  metadata?: any;
}

export interface UpdateCampaignDTO {
  name?: string;
  description?: string;
  subject?: string;
  content?: string;
  status?: CampaignStatus;
  scheduledAt?: Date;
  startDate?: Date;
  endDate?: Date;
  targetAudience?: string[];
  targetingRules?: any;
  aBTestConfig?: any;
  metadata?: any;
}

export class CampaignService {
  private campaignRepository: Repository<Campaign>;

  constructor() {
    this.campaignRepository = AppDataSource.getRepository(Campaign);
  }

  async createCampaign(dto: CreateCampaignDTO): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...dto,
      status: CampaignStatus.DRAFT,
    });

    return await this.campaignRepository.save(campaign);
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    return await this.campaignRepository.findOne({ where: { id } });
  }

  async getCampaignsByPharmacy(pharmacyId: string): Promise<Campaign[]> {
    return await this.campaignRepository.find({
      where: { pharmacyId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCampaignsByStatus(pharmacyId: string, status: CampaignStatus): Promise<Campaign[]> {
    return await this.campaignRepository.find({
      where: { pharmacyId, status },
      order: { createdAt: 'DESC' },
    });
  }

  async updateCampaign(id: string, dto: UpdateCampaignDTO): Promise<Campaign> {
    await this.campaignRepository.update(id, dto);

    const campaign = await this.getCampaignById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return campaign;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const result = await this.campaignRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async executeCampaign(id: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.SCHEDULED && campaign.status !== CampaignStatus.DRAFT) {
      throw new Error(`Cannot execute campaign with status: ${campaign.status}`);
    }

    campaign.status = CampaignStatus.ACTIVE;
    campaign.startDate = new Date();

    return await this.campaignRepository.save(campaign);
  }

  async pauseCampaign(id: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new Error(`Cannot pause campaign with status: ${campaign.status}`);
    }

    campaign.status = CampaignStatus.PAUSED;

    return await this.campaignRepository.save(campaign);
  }

  async completeCampaign(id: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.status = CampaignStatus.COMPLETED;
    campaign.endDate = new Date();

    return await this.campaignRepository.save(campaign);
  }

  async cancelCampaign(id: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.status = CampaignStatus.CANCELLED;

    return await this.campaignRepository.save(campaign);
  }

  async updateCampaignAnalytics(
    id: string,
    metrics: {
      totalRecipients?: number;
      sentCount?: number;
      failedCount?: number;
      openCount?: number;
      clickCount?: number;
      conversionCount?: number;
    },
  ): Promise<Campaign> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (metrics.totalRecipients !== undefined) {
      campaign.totalRecipients = metrics.totalRecipients;
    }
    if (metrics.sentCount !== undefined) {
      campaign.sentCount = metrics.sentCount;
    }
    if (metrics.failedCount !== undefined) {
      campaign.failedCount = metrics.failedCount;
    }
    if (metrics.openCount !== undefined) {
      campaign.openCount = metrics.openCount;
    }
    if (metrics.clickCount !== undefined) {
      campaign.clickCount = metrics.clickCount;
    }
    if (metrics.conversionCount !== undefined) {
      campaign.conversionCount = metrics.conversionCount;
    }

    // Calculate rates
    if (campaign.totalRecipients > 0) {
      campaign.openRate = (campaign.openCount / campaign.totalRecipients) * 100;
      campaign.clickRate = (campaign.clickCount / campaign.totalRecipients) * 100;
      campaign.conversionRate = (campaign.conversionCount / campaign.totalRecipients) * 100;
    }

    return await this.campaignRepository.save(campaign);
  }

  async getScheduledCampaigns(): Promise<Campaign[]> {
    return await this.campaignRepository.find({
      where: { status: CampaignStatus.SCHEDULED },
      order: { scheduledAt: 'ASC' },
    });
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return await this.campaignRepository.find({
      where: { status: CampaignStatus.ACTIVE },
    });
  }

  async getExpiredCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return await this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.endDate IS NOT NULL AND campaign.endDate < :now', { now })
      .andWhere('campaign.status != :completed', { completed: CampaignStatus.COMPLETED })
      .getMany();
  }

  async duplicateCampaign(campaignId: string, newName: string): Promise<Campaign> {
    const original = await this.getCampaignById(campaignId);
    if (!original) {
      throw new Error('Campaign not found');
    }

    const duplicate = this.campaignRepository.create({
      ...original,
      id: undefined,
      name: newName,
      status: CampaignStatus.DRAFT,
      sentCount: 0,
      failedCount: 0,
      openCount: 0,
      clickCount: 0,
      conversionCount: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      totalRecipients: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.campaignRepository.save(duplicate);
  }
}
