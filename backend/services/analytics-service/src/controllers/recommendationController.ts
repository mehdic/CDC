/**
 * Recommendation Controller
 * T5-032: HTTP endpoints for AI recommendations
 */

import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';

export class RecommendationController {
  private recommendationService: RecommendationService;

  constructor() {
    this.recommendationService = new RecommendationService();
  }

  generateRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const recommendations = await this.recommendationService.generateRecommendations(req.body);
      res.status(200).json({ success: true, data: recommendations });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getActiveRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const recommendations = await this.recommendationService.getActiveRecommendations(req.params.userId);
      res.status(200).json({ success: true, data: recommendations });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  trackView = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.recommendationService.trackView(req.params.recommendationId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  trackClick = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.recommendationService.trackClick(req.params.recommendationId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  trackConversion = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.recommendationService.trackConversion(req.params.recommendationId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  dismissRecommendation = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.recommendationService.dismissRecommendation(req.params.recommendationId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getABTestMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await this.recommendationService.getABTestMetrics(req.params.experimentId);
      res.status(200).json({ success: true, data: metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
