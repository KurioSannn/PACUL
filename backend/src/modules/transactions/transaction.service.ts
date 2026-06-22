import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  validateMaterialBatchStatusTransition,
  validateOrderStatusTransition,
} from '../../common/config/status-transitions';
import { SupabaseService } from '../../supabase/supabase.service';
import type { MaterialBatchStatus } from '../materials/materials.types';
import type { OrderStatus } from '../orders/orders.types';
import type { UserRole } from '../profiles/profiles.types';
import { TraceabilityService } from '../traceability/traceability.service';
import { PointsService } from '../eco-points/points.service';
import { AuditService } from '../notifications/audit.service';
import { NotificationService } from '../notifications/notification.service';
import type { Transaction, TransactionStatus } from './transactions.types';

interface CompensationStep {
  label: string;
  run: () => Promise<void>;
}

interface OrderTransactionRow {
  id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  status: string;
  final_weight_kg: number | string | null;
  final_price_per_kg: number | string | null;
  total_amount: number | string | null;
}

interface TransactionRow {
  id: string;
  order_id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  amount: number | string;
  status: string;
  payment_method: string;
  payment_reference: string | null;
  notes: string | null;
  simulated_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

interface BatchTransactionRow {
  id: string;
  status: string;
}

const TRANSACTION_SELECT = `
  id,
  order_id,
  industry_id,
  collector_id,
  batch_id,
  amount,
  status,
  payment_method,
  payment_reference,
  notes,
  simulated_at,
  completed_at,
  cancelled_at,
  created_at
`;

const COMPLETABLE_TRANSACTION_STATUSES: readonly TransactionStatus[] = [
  'simulated_pending',
  'simulated_paid',
];

@Injectable()
export class TransactionService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly traceabilityService: TraceabilityService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly pointsService: PointsService,
  ) {}

  async simulateTransaction(
    orderId: string,
    industryId: string,
  ): Promise<Transaction> {
    const order = await this.fetchOrderForTransaction(orderId);

    if (!order) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    if (order.industry_id !== industryId) {
      throw new ForbiddenException({
        error: 'Only the ordering industry can simulate payment',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    if (order.status !== 'accepted') {
      throw new BadRequestException({
        error: 'Transaction simulation requires an accepted order',
        code: 'TRANSACTION_SIMULATE_INVALID_ORDER',
      });
    }

    if (order.final_weight_kg === null || order.final_price_per_kg === null) {
      throw new BadRequestException({
        error: 'Accepted order is missing final price or weight',
        code: 'TRANSACTION_MISSING_FINAL_VALUES',
      });
    }

    const existingTransaction = await this.fetchTransactionByOrderId(orderId);

    if (existingTransaction) {
      throw new BadRequestException({
        error: 'A transaction already exists for this order',
        code: 'TRANSACTION_ALREADY_EXISTS',
      });
    }

    const finalWeightKg = Number(order.final_weight_kg);
    const finalPricePerKg = Number(order.final_price_per_kg);
    const amount = Math.round(finalWeightKg * finalPricePerKg);
    const simulatedAt = new Date().toISOString();
    const paymentReference = `SIM-${Date.now()}-${orderId.slice(0, 8).toUpperCase()}`;

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('transactions')
      .insert({
        order_id: orderId,
        industry_id: order.industry_id,
        collector_id: order.collector_id,
        batch_id: order.batch_id,
        amount,
        status: 'simulated_pending',
        payment_method: 'simulation',
        payment_reference: paymentReference,
        simulated_at: simulatedAt,
      })
      .select(TRANSACTION_SELECT)
      .single<TransactionRow>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create simulated transaction',
        code: 'TRANSACTION_CREATE_FAILED',
        details: error?.message,
      });
    }

    return this.mapTransaction(data);
  }

  async completeTransaction(
    transactionId: string,
    actorId: string,
  ): Promise<Transaction> {
    const transaction = await this.fetchTransactionById(transactionId);

    if (!transaction) {
      throw new NotFoundException({
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    this.assertPartyAccess(transaction, actorId);

    const currentStatus = transaction.status as TransactionStatus;

    if (!COMPLETABLE_TRANSACTION_STATUSES.includes(currentStatus)) {
      throw new BadRequestException({
        error: 'Transaction cannot be completed from its current status',
        code: 'TRANSACTION_INVALID_STATE',
      });
    }

    const order = await this.fetchOrderForTransaction(transaction.order_id);

    if (!order) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    if (order.status !== 'accepted') {
      throw new BadRequestException({
        error: 'Order must be accepted before transaction can complete',
        code: 'TRANSACTION_COMPLETE_INVALID_ORDER',
      });
    }

    const batch = await this.fetchBatchForTransaction(transaction.batch_id);

    if (!batch) {
      throw new NotFoundException({
        error: 'Material batch not found',
        code: 'MATERIAL_BATCH_NOT_FOUND',
      });
    }

    const batchStatus = batch.status as MaterialBatchStatus;

    if (!validateMaterialBatchStatusTransition(batchStatus, 'sold')) {
      throw new BadRequestException({
        error: 'Material batch cannot be marked sold from its current status',
        code: 'INVALID_BATCH_TRANSITION',
      });
    }

    const completedAt = new Date().toISOString();
    let orderCompleted = false;
    let batchSold = false;

    try {
      await this.updateTransactionStatus(transactionId, currentStatus, {
        status: 'completed',
        completed_at: completedAt,
      });

      await this.updateOrderStatus(transaction.order_id, 'accepted', {
        status: 'completed',
        completed_at: completedAt,
      });
      orderCompleted = true;

      await this.updateBatchStatus(batch.id, batchStatus, {
        status: 'sold',
        sold_at: completedAt,
      });
      batchSold = true;

      this.traceabilityService.emitEvent({
        eventType: 'transaction_completed',
        entityType: 'transaction',
        entityId: transaction.id,
        actorId,
        linkedEntityType: 'order',
        linkedEntityId: transaction.order_id,
        metadata: {
          industryId: transaction.industry_id,
          collectorId: transaction.collector_id,
          batchId: transaction.batch_id,
          amount: Number(transaction.amount),
        },
      });

      void this.pointsService.awardPoints({
        userId: transaction.industry_id,
        eventType: 'transaction_completed',
        entityType: 'transaction',
        entityId: transaction.id,
        description: 'Transaksi material selesai',
      });

      void this.pointsService.awardPoints({
        userId: transaction.collector_id,
        eventType: 'transaction_completed',
        entityType: 'transaction',
        entityId: transaction.id,
        description: 'Transaksi material selesai',
      });

      this.auditService.logAction({
        actorId,
        action: 'transaction.completed',
        entityType: 'transaction',
        entityId: transaction.id,
        metadata: {
          orderId: transaction.order_id,
          industryId: transaction.industry_id,
          collectorId: transaction.collector_id,
          amount: Number(transaction.amount),
        },
      });

      const amount = Number(transaction.amount);
      const completionMessage = `Transaksi selesai dengan nilai Rp ${amount}.`;

      this.notificationService.createNotification({
        userId: transaction.industry_id,
        type: 'transaction_completed',
        title: 'Transaksi selesai',
        message: completionMessage,
        data: {
          transactionId: transaction.id,
          orderId: transaction.order_id,
          amount,
        },
      });

      this.notificationService.createNotification({
        userId: transaction.collector_id,
        type: 'transaction_completed',
        title: 'Transaksi selesai',
        message: completionMessage,
        data: {
          transactionId: transaction.id,
          orderId: transaction.order_id,
          amount,
        },
      });

      const updated = await this.fetchTransactionById(transactionId);

      if (!updated) {
        throw new InternalServerErrorException({
          error: 'Failed to load completed transaction',
          code: 'TRANSACTION_LOAD_FAILED',
        });
      }

      return this.mapTransaction(updated);
    } catch (error) {
      await this.runCompensations([
        {
          label: 'revert-batch-sold',
          run: async () => {
            if (batchSold) {
              await this.revertBatchSold(batch.id, batchStatus, completedAt);
            }
          },
        },
        {
          label: 'revert-order-completed',
          run: async () => {
            if (orderCompleted) {
              await this.updateOrderStatus(transaction.order_id, 'completed', {
                status: 'accepted',
                completed_at: null,
              });
            }
          },
        },
        {
          label: 'revert-transaction-completed',
          run: async () => {
            await this.updateTransactionStatus(transactionId, 'completed', {
              status: currentStatus,
              completed_at: null,
            });
          },
        },
      ]);
      throw error;
    }
  }

  async listTransactions(
    userId: string,
    role: UserRole,
  ): Promise<Transaction[]> {
    if (role !== 'industry' && role !== 'collector') {
      throw new ForbiddenException({
        error: 'Role is not allowed to list transactions',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .order('created_at', { ascending: false });

    if (role === 'industry') {
      query = query.eq('industry_id', userId);
    } else {
      query = query.eq('collector_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load transactions',
        code: 'TRANSACTION_LIST_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapTransaction(row));
  }

  private assertPartyAccess(row: TransactionRow, requesterId: string): void {
    if (row.industry_id !== requesterId && row.collector_id !== requesterId) {
      throw new NotFoundException({
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND',
      });
    }
  }

  private async runCompensations(steps: CompensationStep[]): Promise<void> {
    for (const step of steps) {
      try {
        await step.run();
      } catch {
        // Best-effort rollback only.
      }
    }
  }

  private async fetchOrderForTransaction(
    orderId: string,
  ): Promise<OrderTransactionRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select(
        'id, industry_id, collector_id, batch_id, status, final_weight_kg, final_price_per_kg, total_amount',
      )
      .eq('id', orderId)
      .maybeSingle<OrderTransactionRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load order for transaction',
        code: 'ORDER_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchBatchForTransaction(
    batchId: string,
  ): Promise<BatchTransactionRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .select('id, status')
      .eq('id', batchId)
      .maybeSingle<BatchTransactionRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batch for transaction',
        code: 'MATERIAL_BATCH_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchTransactionById(
    transactionId: string,
  ): Promise<TransactionRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('id', transactionId)
      .maybeSingle<TransactionRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load transaction',
        code: 'TRANSACTION_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchTransactionByOrderId(
    orderId: string,
  ): Promise<TransactionRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('order_id', orderId)
      .maybeSingle<TransactionRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load transaction by order',
        code: 'TRANSACTION_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async updateTransactionStatus(
    transactionId: string,
    currentStatus: string,
    updatePayload: Record<string, unknown>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('transactions')
      .update(updatePayload)
      .eq('id', transactionId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update transaction status',
        code: 'TRANSACTION_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Transaction status changed before update could complete',
        code: 'TRANSACTION_INVALID_STATE',
      });
    }
  }

  private async updateOrderStatus(
    orderId: string,
    currentStatus: string,
    updatePayload: Record<string, unknown>,
  ): Promise<void> {
    const nextStatus = updatePayload.status as OrderStatus;

    if (
      !validateOrderStatusTransition(currentStatus as OrderStatus, nextStatus)
    ) {
      throw new BadRequestException({
        error: 'Invalid order transition for transaction completion',
        code: 'INVALID_ORDER_TRANSITION',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update order during transaction completion',
        code: 'ORDER_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Order status changed before transaction completion',
        code: 'INVALID_ORDER_TRANSITION',
      });
    }
  }

  private async updateBatchStatus(
    batchId: string,
    currentStatus: string,
    updatePayload: Record<string, unknown>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .update(updatePayload)
      .eq('id', batchId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update material batch during transaction completion',
        code: 'BATCH_STATUS_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Material batch status changed before transaction completion',
        code: 'INVALID_BATCH_TRANSITION',
      });
    }
  }

  private async revertBatchSold(
    batchId: string,
    previousStatus: MaterialBatchStatus,
    soldAt: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    await admin
      .from('material_batches')
      .update({
        status: previousStatus,
        sold_at: null,
      })
      .eq('id', batchId)
      .eq('status', 'sold')
      .eq('sold_at', soldAt);
  }

  private mapTransaction(row: TransactionRow): Transaction {
    return {
      id: row.id,
      order_id: row.order_id,
      industry_id: row.industry_id,
      collector_id: row.collector_id,
      batch_id: row.batch_id,
      amount: Number(row.amount),
      status: row.status as TransactionStatus,
      payment_method: row.payment_method,
      payment_reference: row.payment_reference,
      notes: row.notes,
      simulated_at: row.simulated_at,
      completed_at: row.completed_at,
      cancelled_at: row.cancelled_at,
      created_at: row.created_at,
    };
  }
}
