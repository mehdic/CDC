/**
 * Analytics Controller
 * Handles HTTP requests for analytics endpoints
 */

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * GET /api/analytics/dashboard/:pharmacyId
   * Get comprehensive dashboard data for a pharmacy
   */
  getDashboard = async (req: Request, res: Response) => {
    try {
      const { pharmacyId } = req.params;
      const user = (req as any).user;

      // Verify user has access to this pharmacy
      if (user.pharmacyId && user.pharmacyId !== pharmacyId && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Access denied to this pharmacy',
        });
      }

      const dashboard = await this.analyticsService.getDashboard(pharmacyId);

      return res.status(200).json({
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data',
      });
    }
  };

  /**
   * GET /api/analytics/metrics/:pharmacyId
   * Get metrics summary for a pharmacy
   */
  getMetrics = async (req: Request, res: Response) => {
    try {
      const { pharmacyId } = req.params;
      const user = (req as any).user;

      // Verify user has access to this pharmacy
      if (user.pharmacyId && user.pharmacyId !== pharmacyId && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Access denied to this pharmacy',
        });
      }

      const metrics = await this.analyticsService.getMetrics(pharmacyId);

      return res.status(200).json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch metrics',
      });
    }
  };

  /**
   * GET /api/analytics/revenue/:pharmacyId
   * Get revenue trends for a date range
   */
  getRevenueTrends = async (req: Request, res: Response) => {
    try {
      const { pharmacyId } = req.params;
      const { startDate, endDate } = req.query;
      const user = (req as any).user;

      // Verify user has access to this pharmacy
      if (user.pharmacyId && user.pharmacyId !== pharmacyId && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Access denied to this pharmacy',
        });
      }

      const trends = await this.analyticsService.getRevenueTrends(
        pharmacyId,
        startDate as string,
        endDate as string
      );

      return res.status(200).json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching revenue trends:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch revenue trends',
      });
    }
  };

  /**
   * GET /api/analytics/prescriptions/:pharmacyId
   * Get prescription trends for a date range
   */
  getPrescriptionTrends = async (req: Request, res: Response) => {
    try {
      const { pharmacyId } = req.params;
      const { startDate, endDate } = req.query;
      const user = (req as any).user;

      // Verify user has access to this pharmacy
      if (user.pharmacyId && user.pharmacyId !== pharmacyId && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Access denied to this pharmacy',
        });
      }

      const trends = await this.analyticsService.getPrescriptionTrends(
        pharmacyId,
        startDate as string,
        endDate as string
      );

      return res.status(200).json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching prescription trends:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch prescription trends',
      });
    }
  };

  /**
   * Health check endpoint
   */
  health = async (_req: Request, res: Response) => {
    try {
      return res.status(200).json({
        status: 'healthy',
        service: 'analytics-service',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error checking health:', error);
      return res.status(500).json({
        success: false,
        error: 'Health check failed',
      });
    }
  };
}
