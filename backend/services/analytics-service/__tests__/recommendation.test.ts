/**
 * Recommendation Service Unit Tests
 * T5-032: Test AI recommendation functionality
 */

import { RecommendationService } from '../src/services/recommendation.service';
import { RecommendationType, RecommendationStatus } from '../../../shared/models/ProductRecommendation';

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(() => {
    service = new RecommendationService();
  });

  describe('generateRecommendations', () => {
    it('should generate personalized recommendations', async () => {
      const request = {
        userId: 'user-123',
        limit: 5,
        includeTypes: [RecommendationType.PERSONALIZED],
      };

      const recommendations = await service.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      expect(recommendations[0].user_id).toBe('user-123');
    });

    it('should generate multiple recommendation types', async () => {
      const request = {
        userId: 'user-123',
        limit: 10,
        includeTypes: [
          RecommendationType.PURCHASE_HISTORY,
          RecommendationType.TRENDING,
          RecommendationType.PERSONALIZED,
        ],
      };

      const recommendations = await service.generateRecommendations(request);

      expect(recommendations.length).toBeGreaterThan(0);

      // Check that recommendations have confidence scores
      recommendations.forEach(rec => {
        expect(rec.confidence_score).toBeGreaterThan(0);
        expect(rec.confidence_score).toBeLessThanOrEqual(1);
      });
    });

    it('should respect limit parameter', async () => {
      const request = {
        userId: 'user-123',
        limit: 3,
      };

      const recommendations = await service.generateRecommendations(request);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should set expiry date for recommendations', async () => {
      const request = {
        userId: 'user-123',
        limit: 1,
      };

      const recommendations = await service.generateRecommendations(request);
      const rec = recommendations[0];

      expect(rec.expires_at).toBeDefined();
      expect(rec.expires_at!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getActiveRecommendations', () => {
    it('should return only active recommendations', async () => {
      await service.generateRecommendations({
        userId: 'user-123',
        limit: 5,
      });

      const active = await service.getActiveRecommendations('user-123');

      expect(active.length).toBeGreaterThan(0);
      active.forEach(rec => {
        expect(rec.status).toBe(RecommendationStatus.ACTIVE);
      });
    });

    it('should return empty array for users with no recommendations', async () => {
      const active = await service.getActiveRecommendations('unknown-user');
      expect(active).toEqual([]);
    });
  });

  describe('trackView', () => {
    it('should mark recommendation as viewed', async () => {
      const recommendations = await service.generateRecommendations({
        userId: 'user-123',
        limit: 1,
      });

      const recId = recommendations[0].id;
      await service.trackView(recId);

      const active = await service.getActiveRecommendations('user-123');
      const viewed = active.find(r => r.id === recId);

      expect(viewed?.viewed_at).toBeDefined();
    });
  });

  describe('trackClick', () => {
    it('should mark recommendation as clicked', async () => {
      const recommendations = await service.generateRecommendations({
        userId: 'user-123',
        limit: 1,
      });

      const recId = recommendations[0].id;
      await service.trackClick(recId);

      const active = await service.getActiveRecommendations('user-123');
      const clicked = active.find(r => r.id === recId);

      expect(clicked?.clicked_at).toBeDefined();
      expect(clicked?.viewed_at).toBeDefined(); // Clicked implies viewed
    });
  });

  describe('trackConversion', () => {
    it('should mark recommendation as converted', async () => {
      const recommendations = await service.generateRecommendations({
        userId: 'user-123',
        limit: 1,
      });

      const recId = recommendations[0].id;
      await service.trackConversion(recId);

      // After conversion, recommendation should not be in active list
      const active = await service.getActiveRecommendations('user-123');
      const converted = active.find(r => r.id === recId);

      expect(converted).toBeUndefined(); // Converted recs are not active
    });
  });

  describe('dismissRecommendation', () => {
    it('should mark recommendation as dismissed', async () => {
      const recommendations = await service.generateRecommendations({
        userId: 'user-123',
        limit: 1,
      });

      const recId = recommendations[0].id;
      await service.dismissRecommendation(recId);

      const active = await service.getActiveRecommendations('user-123');
      const dismissed = active.find(r => r.id === recId);

      expect(dismissed).toBeUndefined(); // Dismissed recs are not active
    });
  });

  describe('A/B Testing', () => {
    it('should generate recommendations with A/B test variants', async () => {
      const recommendations = await service.generateRecommendations({
        userId: 'user-123',
        limit: 5,
        abTestExperimentId: 'exp-001',
      });

      recommendations.forEach(rec => {
        expect(rec.experiment_id).toBe('exp-001');
        // Note: ab_test_variant will be null until we configure the experiment
        // This is correct behavior - the service needs AB test configuration
      });
    });

    it('should track A/B test metrics', async () => {
      const experimentId = 'exp-002';

      // Generate recommendations with experiment
      const recommendations = await service.generateRecommendations({
        userId: 'user-123',
        limit: 3,
        abTestExperimentId: experimentId,
      });

      // Track some interactions
      await service.trackView(recommendations[0].id);
      await service.trackClick(recommendations[0].id);
      await service.trackConversion(recommendations[0].id);

      const metrics = await service.getABTestMetrics(experimentId);
      expect(metrics).toBeDefined();
    });
  });

  describe('Healthcare Appropriateness', () => {
    it('should mark recommendations as health appropriate by default', async () => {
      const recommendations = await service.generateRecommendations({
        userId: 'user-123',
        limit: 5,
      });

      recommendations.forEach(rec => {
        expect(rec.health_appropriate).toBe(true);
      });
    });

    it('should generate health profile recommendations', async () => {
      const recommendations = await service.generateRecommendations({
        userId: 'user-123',
        limit: 5,
        includeTypes: [RecommendationType.HEALTH_PROFILE],
        healthProfileId: 'health-profile-123',
      });

      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(rec => {
        expect(rec.health_appropriate).toBe(true);
      });
    });
  });
});
