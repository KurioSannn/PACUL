export type TransactionStatus =
  | 'simulated_pending'
  | 'simulated_paid'
  | 'completed'
  | 'cancelled';

export interface Transaction {
  id: string;
  order_id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  amount: number;
  status: TransactionStatus;
  payment_method: string;
  payment_reference: string | null;
  notes: string | null;
  simulated_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}
