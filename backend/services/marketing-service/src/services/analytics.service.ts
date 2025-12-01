/**
 * Analytics Service
 * Track and analyze campaign performance metrics
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CampaignAnalytics } from '../entities/CampaignAnalytics';

export interface TrackEventDTO {
  campaignId: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhoneNumber?: string;
  eventType: 'sent' | 'opened' | 'clicked' | 'converted' | 'bounced' | 'unsubscribed' | 'complained';
  metadata?: Record<string, any>;
}

export interface CampaignMetrics {
  campaignId: string;
  totalSent: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalBounced: number;
  totalUnsubscribed: number;
  totalComplaints: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
  uniqueOpens: number;
  uniqueClicks: number;
  averageClicksPerOpenedEmail: number;
}

export interface EngagementData {
  date: string;
  opens: number;
  clicks: number;
  conversions: number;
  bounces: number;
  unsubscribes: number;
}

export class AnalyticsService {
  private analyticsRepository: Repository<CampaignAnalytics>;

  constructor() {
    this.analyticsRepository = AppDataSource.getRepository(CampaignAnalytics);
  }

  async trackEvent(dto: TrackEventDTO): Promise<CampaignAnalytics> {
    let analytics = await this.analyticsRepository.findOne({
      where: {
        campaignId: dto.campaignId,
        recipientId: dto.recipientId,
      },
    });

    if (!analytics) {
      analytics = this.analyticsRepository.create({
        campaignId: dto.campaignId,
        recipientId: dto.recipientId,
        recipientEmail: dto.recipientEmail,
        recipientPhoneNumber: dto.recipientPhoneNumber,
        metadata: dto.metadata,
      });
    }

    const now = new Date();

    switch (dto.eventType) {
      case 'sent':
        analytics.sent = true;
        analytics.sentAt = now;
        break;

      case 'opened':
        if (!analytics.opened) {
          analytics.opened = true;
          analytics.openedAt = now;
        }
        analytics.openCount += 1;
        break;

      case 'clicked':
        if (!analytics.clicked) {
          analytics.clicked = true;
          analytics.clickedAt = now;
        }
        analytics.clickCount += 1;
        if (dto.metadata?.url) {
          if (!analytics.clickedLinks) {
            analytics.clickedLinks = [];
          }
          if (!analytics.clickedLinks.includes(dto.metadata.url)) {
            analytics.clickedLinks.push(dto.metadata.url);
          }
        }
        break;

      case 'converted':
        if (!analytics.converted) {
          analytics.converted = true;
          analytics.convertedAt = now;
        }
        if (dto.metadata?.value) {
          analytics.conversionValue = dto.metadata.value;
        }
        if (dto.metadata?.type) {
          analytics.conversionType = dto.metadata.type;
        }
        break;

      case 'bounced':
        analytics.bounced = true;
        analytics.bouncedAt = now;
        if (dto.metadata?.type) {
          analytics.bounceType = dto.metadata.type;
        }
        break;

      case 'unsubscribed':
        analytics.unsubscribed = true;
        analytics.unsubscribedAt = now;
        break;

      case 'complained':
        analytics.complained = true;
        analytics.complainedAt = now;
        break;
    }

    return await this.analyticsRepository.save(analytics);
  }

  async getAnalyticsByCampaign(campaignId: string): Promise<CampaignAnalytics[]> {
    return await this.analyticsRepository.find({
      where: { campaignId },
      order: { timestamp: 'DESC' },
    });
  }

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const analytics = await this.getAnalyticsByCampaign(campaignId);

    const totalSent = analytics.filter((a) => a.sent).length;
    const totalFailed = analytics.filter((a) => !a.sent).length;
    const totalOpened = analytics.filter((a) => a.opened).length;
    const totalClicked = analytics.filter((a) => a.clicked).length;
    const totalConverted = analytics.filter((a) => a.converted).length;
    const totalBounced = analytics.filter((a) => a.bounced).length;
    const totalUnsubscribed = analytics.filter((a) => a.unsubscribed).length;
    const totalComplaints = analytics.filter((a) => a.complained).length;

    const total = Math.max(totalSent, 1);

    return {
      campaignId,
      totalSent,
      totalFailed,
      totalOpened,
      totalClicked,
      totalConverted,
      totalBounced,
      totalUnsubscribed,
      totalComplaints,
      openRate: (totalOpened / total) * 100,
      clickRate: (totalClicked / total) * 100,
      conversionRate: (totalConverted / total) * 100,
      bounceRate: (totalBounced / total) * 100,
      unsubscribeRate: (totalUnsubscribed / total) * 100,
      complaintRate: (totalComplaints / total) * 100,
      uniqueOpens: totalOpened,
      uniqueClicks: totalClicked,
      averageClicksPerOpenedEmail: totalOpened > 0 ? totalClicked / totalOpened : 0,
    };
  }

  async getEngagementTrend(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EngagementData[]> {
    const analytics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.campaignId = :campaignId', { campaignId })
      .andWhere('analytics.timestamp >= :startDate', { startDate })
      .andWhere('analytics.timestamp <= :endDate', { endDate })
      .orderBy('analytics.timestamp', 'ASC')
      .getMany();

    const data: Record<string, EngagementData> = {};

    for (const record of analytics) {
      const dateKey = record.timestamp.toISOString().split('T')[0];

      if (!data[dateKey]) {
        data[dateKey] = {
          date: dateKey,
          opens: 0,
          clicks: 0,
          conversions: 0,
          bounces: 0,
          unsubscribes: 0,
        };
      }

      if (record.opened) {
        data[dateKey].opens += record.openCount || 1;
      }
      if (record.clicked) {
        data[dateKey].clicks += record.clickCount || 1;
      }
      if (record.converted) {
        data[dateKey].conversions += 1;
      }
      if (record.bounced) {
        data[dateKey].bounces += 1;
      }
      if (record.unsubscribed) {
        data[dateKey].unsubscribes += 1;
      }
    }

    return Object.values(data);
  }

  async getTopClickedLinks(campaignId: string, limit: number = 10): Promise<{ url: string; clicks: number }[]> {
    const analytics = await this.analyticsRepository.find({
      where: { campaignId, clicked: true },
    });

    const linkClicks: Record<string, number> = {};

    for (const record of analytics) {
      if (record.clickedLinks && record.clickedLinks.length > 0) {
        for (const url of record.clickedLinks) {
          linkClicks[url] = (linkClicks[url] || 0) + 1;
        }
      }
    }

    return Object.entries(linkClicks)
      .map(([url, clicks]) => ({ url, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);
  }

  async getDeviceBreakdown(campaignId: string): Promise<Record<string, number>> {
    const analytics = await this.getAnalyticsByCampaign(campaignId);

    const deviceCounts: Record<string, number> = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      unknown: 0,
    };

    for (const record of analytics) {
      const device = record.deviceType || 'unknown';
      if (device in deviceCounts) {
        deviceCounts[device] += 1;
      }
    }

    return deviceCounts;
  }

  async getGeographicBreakdown(campaignId: string): Promise<Record<string, number>> {
    const analytics = await this.getAnalyticsByCampaign(campaignId);

    const countryCounts: Record<string, number> = {};

    for (const record of analytics) {
      if (record.country) {
        countryCounts[record.country] = (countryCounts[record.country] || 0) + 1;
      }
    }

    return countryCounts;
  }

  async getConversionPathData(campaignId: string): Promise<{
    totalRecipients: number;
    converted: number;
    conversionTotal: number;
    averageConversionValue: number;
  }> {
    const analytics = await this.getAnalyticsByCampaign(campaignId);

    const converted = analytics.filter((a) => a.converted).length;
    const conversionTotal = analytics.reduce((sum, a) => sum + (a.conversionValue || 0), 0);
    const averageConversionValue = converted > 0 ? conversionTotal / converted : 0;

    return {
      totalRecipients: analytics.length,
      converted,
      conversionTotal,
      averageConversionValue,
    };
  }

  async deleteAnalyticsForCampaign(campaignId: string): Promise<number> {
    const result = await this.analyticsRepository.delete({ campaignId });
    return result.affected || 0;
  }
}
