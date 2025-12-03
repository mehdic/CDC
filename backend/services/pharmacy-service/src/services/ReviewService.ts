/**
 * ReviewService
 * Comprehensive review management service
 * T6-018: Service Reviews Implementation
 */

import { getRepository, Repository, SelectQueryBuilder } from 'typeorm';
import { Review } from '../../../shared/models/Review';
import { ReviewResponse } from '../../../shared/models/ReviewResponse';
import { ServiceReview, ServiceType, ServiceReviewStatus } from '../../../shared/models/ServiceReview';
import { MedicationEffectiveness } from '../../../shared/models/MedicationEffectiveness';
import { SideEffectReport } from '../../../shared/models/SideEffectReport';

export interface CreateReviewRequest {
  product_id: string;
  user_id: string;
  pharmacy_id?: string;
  rating: number;
  title: string;
  comment?: string;
  verified_purchase: boolean;
  image_urls?: string[];
  order_id?: string;
}

export interface CreateServiceReviewRequest {
  service_type: ServiceType;
  reference_id: string;
  patient_id: string;
  pharmacy_id: string;
  provider_id?: string;
  overall_rating: number;
  aspect_ratings: Array<{ aspect: string; rating: number }>;
  comment?: string;
  would_recommend?: boolean;
  issue_resolved?: boolean;
  delivered_on_time?: boolean;
  package_condition?: 'perfect' | 'minor_damage' | 'damaged';
}

export interface CreateMedicationEffectivenessRequest {
  product_id: string;
  patient_id: string;
  prescription_id?: string;
  condition_treated: string;
  effectiveness_rating: number;
  time_to_effect: string;
  duration_of_use?: string;
  side_effects_experienced: boolean;
  would_use_again: boolean;
  notes?: string;
}

export interface CreateSideEffectRequest {
  product_id: string;
  patient_id: string;
  side_effect: string;
  severity: string;
  onset: string;
  duration?: string;
  action_taken: string;
  outcome: string;
  reported_to_doctor: boolean;
  additional_notes?: string;
}

export interface ReviewStatistics {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
  recommendation_rate: number;
  average_effectiveness: number;
  common_side_effects: Array<{ effect: string; count: number; percentage: number }>;
  recent_reviews: Review[];
}

export interface RespondToReviewRequest {
  content: string;
  responded_by: string;
}

export class ReviewService {
  private reviewRepository: Repository<Review>;
  private reviewResponseRepository: Repository<ReviewResponse>;
  private serviceReviewRepository: Repository<ServiceReview>;
  private medicationEffectivenessRepository: Repository<MedicationEffectiveness>;
  private sideEffectReportRepository: Repository<SideEffectReport>;

  constructor() {
    this.reviewRepository = getRepository(Review);
    this.reviewResponseRepository = getRepository(ReviewResponse);
    this.serviceReviewRepository = getRepository(ServiceReview);
    this.medicationEffectivenessRepository = getRepository(MedicationEffectiveness);
    this.sideEffectReportRepository = getRepository(SideEffectReport);
  }

  // ============================================================================
  // Product Reviews
  // ============================================================================

  /**
   * Create a product review
   */
  async createReview(request: CreateReviewRequest): Promise<Review> {
    const review = this.reviewRepository.create({
      product_id: request.product_id,
      user_id: request.user_id,
      rating: request.rating,
      title: request.title,
      comment: request.comment || null,
      verified_purchase: request.verified_purchase,
      image_urls: request.image_urls || null,
      is_approved: false, // Pending moderation
      is_flagged: false,
    });

    return await this.reviewRepository.save(review);
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: string, updates: Partial<CreateReviewRequest>): Promise<Review> {
    const review = await this.reviewRepository.findOne(reviewId);
    if (!review) throw new Error('Review not found');

    Object.assign(review, updates);
    return await this.reviewRepository.save(review);
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    await this.reviewRepository.delete(reviewId);
  }

  /**
   * Get reviews by pharmacy
   */
  async getReviewsByPharmacy(pharmacyId: string, skip: number = 0, take: number = 20): Promise<Review[]> {
    // Note: This requires joining with orders to get pharmacy info
    // For now, we fetch all approved product reviews
    return await this.reviewRepository.find({
      where: {
        is_approved: true,
        is_flagged: false,
      },
      skip,
      take,
      order: { created_at: 'DESC' },
      relations: ['product', 'user'],
    });
  }

  /**
   * Get reviews by product
   */
  async getReviewsByProduct(productId: string, skip: number = 0, take: number = 20): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: {
        product_id: productId,
        is_approved: true,
        is_flagged: false,
      },
      skip,
      take,
      order: { helpful_count: 'DESC', created_at: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Get reviews by patient
   */
  async getReviewsByPatient(patientId: string, skip: number = 0, take: number = 20): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: {
        user_id: patientId,
      },
      skip,
      take,
      order: { created_at: 'DESC' },
      relations: ['product'],
    });
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne(reviewId);
    if (!review) throw new Error('Review not found');

    review.markHelpful();
    return await this.reviewRepository.save(review);
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: string, reason: string, reportedBy: string): Promise<Review> {
    const review = await this.reviewRepository.findOne(reviewId);
    if (!review) throw new Error('Review not found');

    review.flag(reason, reportedBy);
    return await this.reviewRepository.save(review);
  }

  /**
   * Respond to a review (pharmacy response)
   */
  async respondToReview(reviewId: string, pharmacyId: string, request: RespondToReviewRequest): Promise<ReviewResponse> {
    const review = await this.reviewRepository.findOne(reviewId);
    if (!review) throw new Error('Review not found');

    const response = this.reviewResponseRepository.create({
      review_id: reviewId,
      pharmacy_id: pharmacyId,
      content: request.content,
      responded_by: request.responded_by,
    });

    return await this.reviewResponseRepository.save(response);
  }

  /**
   * Moderate a review (approve/reject)
   */
  async moderateReview(
    reviewId: string,
    approved: boolean,
    moderatedBy: string,
    reason?: string,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne(reviewId);
    if (!review) throw new Error('Review not found');

    if (approved) {
      review.approve();
    } else {
      review.reject();
    }

    if (!approved && reason) {
      review.flag_reason = reason;
    }

    return await this.reviewRepository.save(review);
  }

  /**
   * Get review statistics for a product
   */
  async getReviewStatistics(productId: string): Promise<ReviewStatistics> {
    const reviews = await this.reviewRepository.find({
      where: {
        product_id: productId,
        is_approved: true,
        is_flagged: false,
      },
      relations: ['user'],
    });

    if (reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recommendation_rate: 0,
        average_effectiveness: 0,
        common_side_effects: [],
        recent_reviews: [],
      };
    }

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;
      totalRating += review.rating;
    });

    const averageRating = totalRating / reviews.length;

    // Get average effectiveness
    const effectivenessReports = await this.medicationEffectivenessRepository.find({
      where: { product_id: productId },
    });

    const averageEffectiveness =
      effectivenessReports.length > 0
        ? effectivenessReports.reduce((sum, report) => sum + report.effectiveness_rating, 0) /
          effectivenessReports.length
        : 0;

    // Get common side effects
    const sideEffectReports = await this.sideEffectReportRepository.find({
      where: { product_id: productId },
    });

    const sideEffectMap = new Map<string, number>();
    sideEffectReports.forEach((report) => {
      const count = sideEffectMap.get(report.side_effect) || 0;
      sideEffectMap.set(report.side_effect, count + 1);
    });

    const commonSideEffects = Array.from(sideEffectMap.entries())
      .map(([effect, count]) => ({
        effect,
        count,
        percentage: (count / sideEffectReports.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      average_rating: Math.round(averageRating * 100) / 100,
      total_reviews: reviews.length,
      rating_distribution: ratingDistribution,
      recommendation_rate: (reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100,
      average_effectiveness: Math.round(averageEffectiveness * 100) / 100,
      common_side_effects: commonSideEffects,
      recent_reviews: reviews.slice(0, 5),
    };
  }

  // ============================================================================
  // Service Reviews
  // ============================================================================

  /**
   * Create a service review
   */
  async createServiceReview(request: CreateServiceReviewRequest): Promise<ServiceReview> {
    const serviceReview = this.serviceReviewRepository.create({
      service_type: request.service_type,
      reference_id: request.reference_id,
      patient_id: request.patient_id,
      pharmacy_id: request.pharmacy_id,
      provider_id: request.provider_id,
      overall_rating: request.overall_rating,
      aspect_ratings: request.aspect_ratings,
      comment: request.comment || null,
      would_recommend: request.would_recommend,
      issue_resolved: request.issue_resolved,
      delivered_on_time: request.delivered_on_time,
      package_condition: request.package_condition,
      status: ServiceReviewStatus.PENDING,
    });

    return await this.serviceReviewRepository.save(serviceReview);
  }

  /**
   * Get service reviews by pharmacy
   */
  async getServiceReviewsByPharmacy(
    pharmacyId: string,
    serviceType?: ServiceType,
    skip: number = 0,
    take: number = 20,
  ): Promise<ServiceReview[]> {
    const query = this.serviceReviewRepository.createQueryBuilder('sr');

    query.where('sr.pharmacy_id = :pharmacyId', { pharmacyId }).andWhere('sr.status = :status', {
      status: ServiceReviewStatus.APPROVED,
    });

    if (serviceType) {
      query.andWhere('sr.service_type = :serviceType', { serviceType });
    }

    return await query.orderBy('sr.created_at', 'DESC').skip(skip).take(take).getMany();
  }

  /**
   * Approve service review
   */
  async approveServiceReview(reviewId: string, approvedBy: string): Promise<ServiceReview> {
    const review = await this.serviceReviewRepository.findOne(reviewId);
    if (!review) throw new Error('Service review not found');

    review.approve(approvedBy);
    return await this.serviceReviewRepository.save(review);
  }

  /**
   * Reject service review
   */
  async rejectServiceReview(reviewId: string, rejectedBy: string): Promise<ServiceReview> {
    const review = await this.serviceReviewRepository.findOne(reviewId);
    if (!review) throw new Error('Service review not found');

    review.reject(rejectedBy);
    return await this.serviceReviewRepository.save(review);
  }

  // ============================================================================
  // Medication Effectiveness
  // ============================================================================

  /**
   * Report medication effectiveness
   */
  async reportEffectiveness(request: CreateMedicationEffectivenessRequest): Promise<MedicationEffectiveness> {
    const report = this.medicationEffectivenessRepository.create({
      product_id: request.product_id,
      patient_id: request.patient_id,
      prescription_id: request.prescription_id,
      condition_treated: request.condition_treated,
      effectiveness_rating: request.effectiveness_rating,
      time_to_effect: request.time_to_effect as any,
      duration_of_use: request.duration_of_use,
      side_effects_experienced: request.side_effects_experienced,
      would_use_again: request.would_use_again,
      notes: request.notes,
    });

    return await this.medicationEffectivenessRepository.save(report);
  }

  /**
   * Get medication effectiveness reports
   */
  async getMedicationReports(productId: string, skip: number = 0, take: number = 20): Promise<MedicationEffectiveness[]> {
    return await this.medicationEffectivenessRepository.find({
      where: { product_id: productId },
      skip,
      take,
      order: { report_date: 'DESC' },
    });
  }

  // ============================================================================
  // Side Effect Reporting
  // ============================================================================

  /**
   * Report a side effect
   */
  async reportSideEffect(request: CreateSideEffectRequest): Promise<SideEffectReport> {
    const report = this.sideEffectReportRepository.create({
      product_id: request.product_id,
      patient_id: request.patient_id,
      side_effect: request.side_effect,
      severity: request.severity as any,
      onset: request.onset as any,
      duration: request.duration,
      action_taken: request.action_taken as any,
      outcome: request.outcome as any,
      reported_to_doctor: request.reported_to_doctor,
      additional_notes: request.additional_notes,
    });

    return await this.sideEffectReportRepository.save(report);
  }

  /**
   * Get side effect reports for a product
   */
  async getSideEffectReports(productId: string, skip: number = 0, take: number = 20): Promise<SideEffectReport[]> {
    return await this.sideEffectReportRepository.find({
      where: { product_id: productId },
      skip,
      take,
      order: { report_date: 'DESC' },
    });
  }

  /**
   * Get severe side effect reports
   */
  async getSevereSideEffects(productId: string): Promise<SideEffectReport[]> {
    return await this.sideEffectReportRepository.find({
      where: {
        product_id: productId,
        severity: 'severe',
      },
      order: { report_date: 'DESC' },
    });
  }
}
