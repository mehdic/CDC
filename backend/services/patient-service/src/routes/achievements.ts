/**
 * Achievement Routes
 * REST endpoints for patient achievements
 * T6-020: Achievements gamification system
 */

import express, { Router } from 'express';
import { AchievementController } from '../controllers/AchievementController';

const router: Router = express.Router();
const achievementController = new AchievementController();

// Get all achievements
router.get('/', (req, res, next) =>
  achievementController.getAllAchievements(req, res, next)
);

// Get specific achievement details
router.get('/:achievementId', (req, res, next) =>
  achievementController.getAchievementDetails(req, res, next)
);

// Get patient's achievements
router.get('/patient/:patientId', (req, res, next) =>
  achievementController.getPatientAchievements(req, res, next)
);

// Unlock achievement
router.post('/unlock', (req, res, next) =>
  achievementController.unlockAchievement(req, res, next)
);

// Leaderboard
router.get('/leaderboard', (req, res, next) =>
  achievementController.getLeaderboard(req, res, next)
);

// Trigger first order achievement
router.post('/triggers/first-order', (req, res, next) =>
  achievementController.triggerFirstOrderAchievement(req, res, next)
);

// Trigger adherence streak achievement
router.post('/triggers/adherence-streak', (req, res, next) =>
  achievementController.triggerAdherenceStreak(req, res, next)
);

// Trigger referral milestone achievement
router.post('/triggers/referral-milestone', (req, res, next) =>
  achievementController.triggerReferralMilestone(req, res, next)
);

// Trigger VIP tier upgrade achievement
router.post('/triggers/vip-tier-upgrade', (req, res, next) =>
  achievementController.triggerVIPTierUpgrade(req, res, next)
);

// Trigger health goal completion achievement
router.post('/triggers/health-goal', (req, res, next) =>
  achievementController.triggerHealthGoal(req, res, next)
);

export default router;
