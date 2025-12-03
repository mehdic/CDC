/**
 * Behavior Tracking Controller
 * T5-031: HTTP endpoints for behavioral tracking
 */

import { Request, Response } from 'express';
import { BehaviorTrackingService } from '../services/behaviorTracking.service';

export class BehaviorController {
  private behaviorService: BehaviorTrackingService;

  constructor() {
    this.behaviorService = new BehaviorTrackingService();
  }

  trackEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const event = await this.behaviorService.trackEvent(req.body);
      res.status(201).json({ success: true, data: event });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getUserPattern = async (req: Request, res: Response): Promise<void> => {
    try {
      const pattern = await this.behaviorService.getUserBehaviorPattern(req.params.userId);
      res.status(200).json({ success: true, data: pattern });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getUserJourney = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, sessionId } = req.params;
      const journey = await this.behaviorService.getUserJourney(userId, sessionId);
      res.status(200).json({ success: true, data: journey });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  deleteUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.behaviorService.deleteUserData(req.params.userId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  anonymizeUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.behaviorService.anonymizeUserData(req.params.userId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getActiveSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const count = await this.behaviorService.getActiveSessions(req.params.userId);
      res.status(200).json({ success: true, data: { count } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
