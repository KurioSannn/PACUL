export type OrderStatus =
  | 'created'
  | 'negotiating'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface Order {
  id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  requested_weight_kg: number;
  final_weight_kg: number | null;
  offered_price_per_kg: number;
  final_price_per_kg: number | null;
  total_amount: number | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  cancel_reason: string | null;
}

export interface OrderBatchSummary {
  id: string;
  name: string;
  category_id: string;
  total_weight_kg: number;
  price_per_kg: number;
  min_order_kg: number;
  status: string;
  city: string | null;
  province: string | null;
}

export interface OrderWithDetails extends Order {
  batch: OrderBatchSummary;
}

export interface CreateOrderDto {
  batchId: string;
  requested_weight_kg: number;
  offered_price_per_kg: number;
  notes?: string;
}

export interface TransitionOrderStatusData {
  cancel_reason?: string;
  final_price_per_kg?: number;
  final_weight_kg?: number;
}
