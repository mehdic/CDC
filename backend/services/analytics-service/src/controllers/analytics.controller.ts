/**
 * Analytics Controller
 * Handles HTTP requests for analytics endpoints
 */

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsFilter, AnalyticsResponse } from '../models/analytics.model';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.analyticsService.initializeMockData();
  }

  /**
   * GET /api/analytics/dashboard/:pharmacyId
   * Get comprehensive dashboard data for a pharmacy
   */
  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pharmacyId } = req.params;
      const { startDate, endDate, groupBy } = req.query;

      if (!pharmacyId) {
        res.status(400).json({
          success: false,
          error: 'Pharmacy ID is required',
          timestamp: new Date().toISOString(),
        } as AnalyticsResponse<null>);
        return;
      }

      const filter: AnalyticsFilter = {
        pharmacyId,
        startDate: (startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: (endDate as string) || new Date().toISOString().split('T')[0],
        groupBy: (groupBy as 'daily' | 'weekly' | 'monthly') || 'daily',
      };

      const dashboardData = this.analyticsService.getDashboardData(pharmacyId, filter);

      res.status(200).json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString(),
      } as AnalyticsResponse<typeof dashboardData>);
    } catch (error) {
      console.error('Error getting dashboard:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        timestamp: new Date().toISOString(),
      } as AnalyticsResponse<null>);
    }
  };

  /**
   * GET /api/analytics/metrics/:pharmacyId
   * Get metrics summary for a pharmacy
   */
  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pharmacyId } = req.params;

      if (!pharmacyId) {
        res.status(400).json({
          success: false,
          error: 'Pharmacy ID is required',
          timestamp: new Date().toISOString(),
        } as AnalyticsResponse<null>);
        return;
      }

      const metrics = this.analyticsService.getMetricsSummary(pharmacyId);

      res.status(200).json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      } as AnalyticsResponse<typeof metrics>);
    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
        timestamp: new Date().toISOString(),
      } as AnalyticsResponse<null>);
    }
  };

  /**
   * GET /api/analytics/revenue/:pharmacyId
   * Get revenue trends for a date range
   */
  getRevenueTrends = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pharmacyId } = req.params;
      const { startDate, endDate } = req.query;

      if (!pharmacyId) {
        res.status(400).json({
          success: false,
          error: 'Pharmacy ID is required',
          timestamp: new Date().toISOString(),
        } as AnalyticsResponse<null>);
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
          timestamp: new Date().toISOString(),
        } as AnalyticsResponse<null>);
        return;
      }

      const trends = this.analyticsService.getRevenueTrends(
        pharmacyId,
        startDate as string,
        endDate as string
      );

      res.status(200).json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
      } as AnalyticsResponse<typeof trends>);
    } catch (error) {
      console.error('Error getting revenue trends:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch revenue trends',
        timestamp: new Date().toISOString(),
      } as AnalyticsResponse<null>);
    }
  };

  /**
   * GET /api/analytics/prescriptions/:pharmacyId
   * Get prescription trends for a date range
   */
  getPrescriptionTrends = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pharmacyId } = req.params;
      const { startDate, endDate } = req.query;

      if (!pharmacyId) {
        res.status(400).json({
          success: false,
          error: 'Pharmacy ID is required',
          timestamp: new Date().toISOString(),
        } as AnalyticsResponse<null>);
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
          timestamp: new Date().toISOString(),
        } as AnalyticsResponse<null>);
        return;
      }

      const trends = this.analyticsService.getPrescriptionTrends(
        pharmacyId,
        startDate as string,
        endDate as string
      );

      res.status(200).json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
      } as AnalyticsResponse<typeof trends>);
    } catch (error) {
      console.error('Error getting prescription trends:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prescription trends',
        timestamp: new Date().toISOString(),
      } as AnalyticsResponse<null>);
    }
  };

  /**
   * Health check endpoint
   */
  health = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: 'healthy',
      service: 'analytics-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  };
}
