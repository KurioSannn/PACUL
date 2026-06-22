export type NegotiationThreadStatus =
  | 'open'
  | 'countered'
  | 'accepted'
  | 'cancelled'
  | 'expired';

export type NegotiationMessageType =
  | 'text'
  | 'offer'
  | 'counter_offer'
  | 'system'
  | 'accepted'
  | 'cancelled';

export type NegotiationOfferStatus =
  | 'pending'
  | 'accepted'
  | 'countered'
  | 'cancelled';

export interface NegotiationThread {
  id: string;
  order_id: string;
  industry_id: string;
  collector_id: string;
  status: NegotiationThreadStatus;
  last_offer_by: string | null;
  last_offer_price_per_kg: number | null;
  last_offer_weight_kg: number | null;
  agreed_price_per_kg: number | null;
  agreed_weight_kg: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NegotiationMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message_type: NegotiationMessageType;
  content: string | null;
  offer_price_per_kg: number | null;
  offer_weight_kg: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NegotiationOffer {
  id: string;
  thread_id: string;
  message_id: string | null;
  offered_by: string;
  price_per_kg: number;
  weight_kg: number;
  status: NegotiationOfferStatus;
  created_at: string;
}

export interface NegotiationThreadWithDetails extends NegotiationThread {
  messages: NegotiationMessage[];
  offers: NegotiationOffer[];
}
