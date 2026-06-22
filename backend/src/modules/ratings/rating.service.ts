import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { UserRole } from '../profiles/profiles.types';
import { TraceabilityService } from '../traceability/traceability.service';
import type {
  RatingContextType,
  RatingDistribution,
  RatingReview,
  RatingSummary,
  SubmitRatingInput,
} from './ratings.types';

interface RatingReviewRow {
  id: string;
  rater_id: string;
  ratee_id: string;
  rating: number;
  review_text: string | null;
  context_type: string;
  context_id: string;
  created_at: string;
}

interface PickupClaimContextRow {
  id: string;
  collector_id: string;
  status: string;
  listing_id: string;
  waste_listings: { household_id: string } | { household_id: string }[] | null;
}

interface OrderContextRow {
  id: string;
  industry_id: string;
  collector_id: string;
  status: string;
}

interface UserProfileRoleRow {
  id: string;
  role: UserRole;
}

const RATING_REVIEW_SELECT = `
  id,
  rater_id,
  ratee_id,
  rating,
  review_text,
  context_type,
  context_id,
  created_at
`;

const EMPTY_DISTRIBUTION = (): RatingDistribution => ({
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
});

@Injectable()
export class RatingService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly traceabilityService: TraceabilityService,
  ) {}

  async submitRating(
    raterId: string,
    raterRole: UserRole,
    dto: SubmitRatingInput,
  ): Promise<RatingReview> {
    if (raterId === dto.rateeId) {
      throw new BadRequestException({
        error: 'You cannot rate yourself',
        code: 'RATING_SELF_NOT_ALLOWED',
      });
    }

    await this.validateRatingContext(
      raterId,
      dto.rateeId,
      raterRole,
      dto.contextType,
      dto.contextId,
    );

    const rateeProfile = await this.fetchUserProfile(dto.rateeId);

    if (!rateeProfile) {
      throw new NotFoundException({
        error: 'Ratee profile not found',
        code: 'RATEE_NOT_FOUND',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ratings_reviews')
      .insert({
        rater_id: raterId,
        ratee_id: dto.rateeId,
        rating: dto.rating,
        review_text: dto.reviewText?.trim() || null,
        context_type: dto.contextType,
        context_id: dto.contextId,
      })
      .select(RATING_REVIEW_SELECT)
      .single<RatingReviewRow>();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException({
          error: 'You have already submitted a rating for this context',
          code: 'RATING_ALREADY_EXISTS',
        });
      }

      throw new InternalServerErrorException({
        error: 'Failed to submit rating',
        code: 'RATING_SUBMIT_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new InternalServerErrorException({
        error: 'Failed to submit rating',
        code: 'RATING_SUBMIT_FAILED',
      });
    }

    await this.updateRatingAverage(dto.rateeId, rateeProfile.role);

    const entityType = dto.contextType === 'pickup' ? 'pickup_claim' : 'order';

    this.traceabilityService.emitEvent({
      eventType: 'rating_submitted',
      entityType,
      entityId: dto.contextId,
      actorId: raterId,
      actorRole: raterRole,
      metadata: {
        rateeId: dto.rateeId,
        rating: dto.rating,
        contextType: dto.contextType,
        reviewText: dto.reviewText?.trim() || null,
      },
    });

    return this.mapReview(data);
  }

  async getRatingSummary(actorId: string): Promise<RatingSummary> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ratings_reviews')
      .select(RATING_REVIEW_SELECT)
      .eq('ratee_id', actorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load rating summary',
        code: 'RATING_SUMMARY_LOAD_FAILED',
        details: error.message,
      });
    }

    const rows = (data ?? []) as RatingReviewRow[];
    const distribution = EMPTY_DISTRIBUTION();
    let total = 0;

    for (const row of rows) {
      const score = Number(row.rating) as 1 | 2 | 3 | 4 | 5;

      if (score >= 1 && score <= 5) {
        distribution[score] += 1;
        total += score;
      }
    }

    const count = rows.length;
    const average = count === 0 ? 0 : Math.round((total / count) * 100) / 100;

    const recentReviews = rows.slice(0, 10).map((row) => this.mapReview(row));

    return {
      average,
      count,
      distribution,
      recentReviews,
    };
  }

  async updateRatingAverage(actorId: string, role: UserRole): Promise<void> {
    if (role !== 'collector' && role !== 'industry') {
      return;
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ratings_reviews')
      .select('rating')
      .eq('ratee_id', actorId);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to aggregate ratings for profile update',
        code: 'RATING_AGGREGATE_FAILED',
        details: error.message,
      });
    }

    const ratings = data ?? [];
    const count = ratings.length;
    const average =
      count === 0
        ? 0
        : Math.round(
            (ratings.reduce((sum, row) => sum + Number(row.rating), 0) /
              count) *
              100,
          ) / 100;

    const table =
      role === 'collector' ? 'collector_profiles' : 'industry_profiles';
    const { error: updateError } = await admin
      .from(table)
      .update({
        rating_average: average,
        rating_count: count,
      })
      .eq('id', actorId);

    if (updateError) {
      throw new InternalServerErrorException({
        error: 'Failed to update profile rating average',
        code: 'RATING_PROFILE_UPDATE_FAILED',
        details: updateError.message,
      });
    }
  }

  private async validateRatingContext(
    raterId: string,
    rateeId: string,
    raterRole: UserRole,
    contextType: RatingContextType,
    contextId: string,
  ): Promise<void> {
    if (contextType === 'pickup') {
      await this.validatePickupRatingContext(
        raterId,
        rateeId,
        raterRole,
        contextId,
      );
      return;
    }

    await this.validateTransactionRatingContext(
      raterId,
      rateeId,
      raterRole,
      contextId,
    );
  }

  private async validatePickupRatingContext(
    raterId: string,
    rateeId: string,
    raterRole: UserRole,
    claimId: string,
  ): Promise<void> {
    if (raterRole === 'industry') {
      throw new ForbiddenException({
        error: 'Industry users cannot submit pickup ratings',
        code: 'RATING_CONTEXT_FORBIDDEN',
      });
    }

    const claim = await this.fetchPickupClaimContext(claimId);

    if (!claim) {
      throw new NotFoundException({
        error: 'Pickup claim not found for rating context',
        code: 'RATING_CONTEXT_NOT_FOUND',
      });
    }

    if (claim.status !== 'picked_up') {
      throw new BadRequestException({
        error: 'Pickup ratings require a completed pickup',
        code: 'RATING_PICKUP_NOT_COMPLETED',
      });
    }

    const listing = Array.isArray(claim.waste_listings)
      ? claim.waste_listings[0]
      : claim.waste_listings;

    if (!listing) {
      throw new BadRequestException({
        error: 'Pickup claim is missing linked listing data',
        code: 'RATING_CONTEXT_INVALID',
      });
    }

    const householdId = listing.household_id;
    const collectorId = claim.collector_id;
    const parties = new Set([householdId, collectorId]);

    if (!parties.has(raterId) || !parties.has(rateeId)) {
      throw new ForbiddenException({
        error: 'Only pickup participants can submit this rating',
        code: 'RATING_NOT_PARTICIPANT',
      });
    }

    if (
      (raterRole === 'household' && rateeId !== collectorId) ||
      (raterRole === 'collector' && rateeId !== householdId)
    ) {
      throw new BadRequestException({
        error: 'Pickup ratings must be between the household and collector',
        code: 'RATING_INVALID_PARTIES',
      });
    }
  }

  private async validateTransactionRatingContext(
    raterId: string,
    rateeId: string,
    raterRole: UserRole,
    orderId: string,
  ): Promise<void> {
    if (raterRole === 'household') {
      throw new ForbiddenException({
        error: 'Household users cannot submit transaction ratings',
        code: 'RATING_CONTEXT_FORBIDDEN',
      });
    }

    const order = await this.fetchOrderContext(orderId);

    if (!order) {
      throw new NotFoundException({
        error: 'Order not found for rating context',
        code: 'RATING_CONTEXT_NOT_FOUND',
      });
    }

    if (order.status !== 'completed') {
      throw new BadRequestException({
        error: 'Transaction ratings require a completed order',
        code: 'RATING_ORDER_NOT_COMPLETED',
      });
    }

    const parties = new Set([order.industry_id, order.collector_id]);

    if (!parties.has(raterId) || !parties.has(rateeId)) {
      throw new ForbiddenException({
        error: 'Only transaction participants can submit this rating',
        code: 'RATING_NOT_PARTICIPANT',
      });
    }

    if (
      (raterRole === 'industry' && rateeId !== order.collector_id) ||
      (raterRole === 'collector' && rateeId !== order.industry_id)
    ) {
      throw new BadRequestException({
        error: 'Transaction ratings must be between the industry and collector',
        code: 'RATING_INVALID_PARTIES',
      });
    }
  }

  private async fetchPickupClaimContext(
    claimId: string,
  ): Promise<PickupClaimContextRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_claims')
      .select(
        'id, collector_id, status, listing_id, waste_listings(household_id)',
      )
      .eq('id', claimId)
      .maybeSingle<PickupClaimContextRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load pickup claim for rating validation',
        code: 'RATING_CONTEXT_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchOrderContext(
    orderId: string,
  ): Promise<OrderContextRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select('id, industry_id, collector_id, status')
      .eq('id', orderId)
      .maybeSingle<OrderContextRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load order for rating validation',
        code: 'RATING_CONTEXT_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchUserProfile(
    userId: string,
  ): Promise<UserProfileRoleRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('user_profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle<UserProfileRoleRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load user profile for rating',
        code: 'RATING_PROFILE_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private mapReview(row: RatingReviewRow): RatingReview {
    return {
      id: row.id,
      raterId: row.rater_id,
      rateeId: row.ratee_id,
      rating: Number(row.rating),
      reviewText: row.review_text,
      contextType: row.context_type as RatingContextType,
      contextId: row.context_id,
      createdAt: row.created_at,
    };
  }
}
