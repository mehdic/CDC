/**
 * ReviewController
 * REST endpoints for review operations
 * T6-018: Service Reviews Implementation
 */

import { Router, Request, Response } from 'express';
import { ReviewService } from '../services/ReviewService';
import { ServiceType } from '@models/ServiceReview';

export class ReviewController {
  private reviewService: ReviewService;
  public router: Router;

  constructor() {
    this.reviewService = new ReviewService();
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Product Reviews
    this.router.post('/reviews/product', this.createProductReview.bind(this));
    this.router.put('/reviews/:reviewId', this.updateReview.bind(this));
    this.router.delete('/reviews/:reviewId', this.deleteReview.bind(this));
    this.router.get('/reviews/product/:productId', this.getReviewsByProduct.bind(this));
    this.router.get('/reviews/patient/:patientId', this.getReviewsByPatient.bind(this));
    this.router.post('/reviews/:reviewId/helpful', this.markReviewHelpful.bind(this));
    this.router.post('/reviews/:reviewId/report', this.reportReview.bind(this));
    this.router.post('/reviews/:reviewId/response', this.respondToReview.bind(this));
    this.router.post('/reviews/:reviewId/moderate', this.moderateReview.bind(this));
    this.router.get('/products/:productId/statistics', this.getReviewStatistics.bind(this));

    // Service Reviews
    this.router.post('/reviews/service', this.createServiceReview.bind(this));
    this.router.get('/reviews/service/:serviceType/:pharmacyId', this.getServiceReviews.bind(this));
    this.router.post('/reviews/service/:reviewId/approve', this.approveServiceReview.bind(this));
    this.router.post('/reviews/service/:reviewId/reject', this.rejectServiceReview.bind(this));

    // Medication Effectiveness
    this.router.post('/medication/effectiveness', this.reportEffectiveness.bind(this));
    this.router.get('/medication/:productId/reports', this.getMedicationReports.bind(this));

    // Side Effects
    this.router.post('/medication/side-effects', this.reportSideEffect.bind(this));
    this.router.get('/medication/:productId/side-effects', this.getSideEffects.bind(this));
    this.router.get('/medication/:productId/severe-side-effects', this.getSevereSideEffects.bind(this));
  }

  // ============================================================================
  // Product Reviews
  // ============================================================================

  async createProductReview(req: Request, res: Response): Promise<void> {
    try {
      const review = await this.reviewService.createReview(req.body);
      res.status(201).json({
        success: true,
        data: review,
        message: 'Review created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create review',
      });
    }
  }

  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const review = await this.reviewService.updateReview(reviewId, req.body);
      res.json({
        success: true,
        data: review,
        message: 'Review updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update review',
      });
    }
  }

  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      await this.reviewService.deleteReview(reviewId);
      res.json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete review',
      });
    }
  }

  async getReviewsByProduct(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const reviews = await this.reviewService.getReviewsByProduct(productId, skip, take);
      res.json({
        success: true,
        data: reviews,
        pagination: { skip, take, count: reviews.length },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviews',
      });
    }
  }

  async getReviewsByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const reviews = await this.reviewService.getReviewsByPatient(patientId, skip, take);
      res.json({
        success: true,
        data: reviews,
        pagination: { skip, take, count: reviews.length },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviews',
      });
    }
  }

  async markReviewHelpful(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const review = await this.reviewService.markHelpful(reviewId);
      res.json({
        success: true,
        data: review,
        message: 'Review marked as helpful',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark review',
      });
    }
  }

  async reportReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { reason, reported_by } = req.body;

      if (!reason || !reported_by) {
        res.status(400).json({
          success: false,
          error: 'Reason and reported_by are required',
        });
        return;
      }

      const review = await this.reviewService.reportReview(reviewId, reason, reported_by);
      res.json({
        success: true,
        data: review,
        message: 'Review reported successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to report review',
      });
    }
  }

  async respondToReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { content, responded_by, pharmacy_id } = req.body;

      if (!content || !responded_by || !pharmacy_id) {
        res.status(400).json({
          success: false,
          error: 'Content, responded_by, and pharmacy_id are required',
        });
        return;
      }

      const response = await this.reviewService.respondToReview(reviewId, pharmacy_id, {
        content,
        responded_by,
      });

      res.status(201).json({
        success: true,
        data: response,
        message: 'Response added successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to respond to review',
      });
    }
  }

  async moderateReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { approved, moderated_by, reason } = req.body;

      if (approved === undefined || !moderated_by) {
        res.status(400).json({
          success: false,
          error: 'approved and moderated_by are required',
        });
        return;
      }

      const review = await this.reviewService.moderateReview(reviewId, approved, moderated_by, reason);
      res.json({
        success: true,
        data: review,
        message: approved ? 'Review approved' : 'Review rejected',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to moderate review',
      });
    }
  }

  async getReviewStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const statistics = await this.reviewService.getReviewStatistics(productId);
      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics',
      });
    }
  }

  // ============================================================================
  // Service Reviews
  // ============================================================================

  async createServiceReview(req: Request, res: Response): Promise<void> {
    try {
      const serviceReview = await this.reviewService.createServiceReview(req.body);
      res.status(201).json({
        success: true,
        data: serviceReview,
        message: 'Service review created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create service review',
      });
    }
  }

  async getServiceReviews(req: Request, res: Response): Promise<void> {
    try {
      const { serviceType, pharmacyId } = req.params;
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const reviews = await this.reviewService.getServiceReviewsByPharmacy(
        pharmacyId,
        serviceType as ServiceType,
        skip,
        take,
      );

      res.json({
        success: true,
        data: reviews,
        pagination: { skip, take, count: reviews.length },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service reviews',
      });
    }
  }

  async approveServiceReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { approved_by } = req.body;

      if (!approved_by) {
        res.status(400).json({
          success: false,
          error: 'approved_by is required',
        });
        return;
      }

      const review = await this.reviewService.approveServiceReview(reviewId, approved_by);
      res.json({
        success: true,
        data: review,
        message: 'Service review approved',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve review',
      });
    }
  }

  async rejectServiceReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { rejected_by } = req.body;

      if (!rejected_by) {
        res.status(400).json({
          success: false,
          error: 'rejected_by is required',
        });
        return;
      }

      const review = await this.reviewService.rejectServiceReview(reviewId, rejected_by);
      res.json({
        success: true,
        data: review,
        message: 'Service review rejected',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject review',
      });
    }
  }

  // ============================================================================
  // Medication Effectiveness
  // ============================================================================

  async reportEffectiveness(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.reviewService.reportEffectiveness(req.body);
      res.status(201).json({
        success: true,
        data: report,
        message: 'Effectiveness report created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create effectiveness report',
      });
    }
  }

  async getMedicationReports(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const reports = await this.reviewService.getMedicationReports(productId, skip, take);
      res.json({
        success: true,
        data: reports,
        pagination: { skip, take, count: reports.length },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch medication reports',
      });
    }
  }

  // ============================================================================
  // Side Effects
  // ============================================================================

  async reportSideEffect(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.reviewService.reportSideEffect(req.body);
      res.status(201).json({
        success: true,
        data: report,
        message: 'Side effect report created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create side effect report',
      });
    }
  }

  async getSideEffects(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const reports = await this.reviewService.getSideEffectReports(productId, skip, take);
      res.json({
        success: true,
        data: reports,
        pagination: { skip, take, count: reports.length },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch side effect reports',
      });
    }
  }

  async getSevereSideEffects(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const reports = await this.reviewService.getSevereSideEffects(productId);
      res.json({
        success: true,
        data: reports,
        count: reports.length,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch severe side effects',
      });
    }
  }
}

export default new ReviewController().router;
