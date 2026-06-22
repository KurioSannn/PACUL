export type RatingContextType = 'pickup' | 'transaction';

export interface SubmitRatingInput {
  rateeId: string;
  rating: number;
  reviewText?: string;
  contextType: RatingContextType;
  contextId: string;
}

export interface RatingReview {
  id: string;
  raterId: string;
  rateeId: string;
  rating: number;
  reviewText: string | null;
  contextType: RatingContextType;
  contextId: string;
  createdAt: string;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface RatingSummary {
  average: number;
  count: number;
  distribution: RatingDistribution;
  recentReviews: RatingReview[];
}
