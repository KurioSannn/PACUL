import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { validateOrderStatusTransition } from '../../common/config/status-transitions';
import { SupabaseService } from '../../supabase/supabase.service';
import { MaterialBatchService } from '../materials/material-batch.service';
import type { UserRole } from '../profiles/profiles.types';
import type { CreateOrderDto } from './dto/create-order.dto';
import type {
  Order,
  OrderBatchSummary,
  OrderStatus,
  OrderWithDetails,
  TransitionOrderStatusData,
} from './orders.types';
import { TraceabilityService } from '../traceability/traceability.service';

interface OrderRow {
  id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  requested_weight_kg: number | string;
  final_weight_kg: number | string | null;
  offered_price_per_kg: number | string;
  final_price_per_kg: number | string | null;
  total_amount: number | string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  cancel_reason: string | null;
}

interface BatchOrderRow {
  id: string;
  collector_id: string;
  name: string;
  category_id: string;
  total_weight_kg: number | string;
  price_per_kg: number | string;
  min_order_kg: number | string;
  status: string;
  city: string | null;
  province: string | null;
}

interface OrderWithBatchJoinRow extends OrderRow {
  batch: BatchOrderRow | BatchOrderRow[] | null;
}

type TransitionActorRole = UserRole | 'system';

const ORDER_SELECT = `
  id,
  industry_id,
  collector_id,
  batch_id,
  requested_weight_kg,
  final_weight_kg,
  offered_price_per_kg,
  final_price_per_kg,
  total_amount,
  status,
  notes,
  created_at,
  updated_at,
  accepted_at,
  rejected_at,
  cancelled_at,
  completed_at,
  cancel_reason
`;

const ORDER_WITH_BATCH_SELECT = `
  ${ORDER_SELECT},
  batch:material_batches (
    id,
    name,
    category_id,
    total_weight_kg,
    price_per_kg,
    min_order_kg,
    status,
    city,
    province
  )
`;

const INDUSTRY_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  created: ['negotiating', 'cancelled'],
  accepted: ['cancelled'],
};

const COLLECTOR_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  created: ['accepted', 'rejected'],
  negotiating: ['accepted', 'rejected'],
  accepted: ['completed'],
};

const SYSTEM_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  accepted: ['completed'],
};

@Injectable()
export class OrderService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly materialBatchService: MaterialBatchService,
    private readonly traceabilityService: TraceabilityService,
  ) {}

  async createOrder(
    industryId: string,
    dto: CreateOrderDto,
  ): Promise<OrderWithDetails> {
    const batch = await this.fetchBatchForOrder(dto.batchId);

    if (!batch) {
      throw new NotFoundException({
        error: 'Material batch not found',
        code: 'MATERIAL_BATCH_NOT_FOUND',
      });
    }

    if (batch.status !== 'available') {
      throw new BadRequestException({
        error: 'Only available material batches can be ordered',
        code: 'BATCH_NOT_ORDERABLE',
      });
    }

    const totalWeightKg = Number(batch.total_weight_kg);
    const minOrderKg = Number(batch.min_order_kg);

    if (dto.requested_weight_kg > totalWeightKg) {
      throw new BadRequestException({
        error: 'Requested weight exceeds available batch weight',
        code: 'ORDER_WEIGHT_EXCEEDS_BATCH',
        details: {
          requested_weight_kg: dto.requested_weight_kg,
          total_weight_kg: totalWeightKg,
        },
      });
    }

    if (dto.requested_weight_kg < minOrderKg) {
      throw new BadRequestException({
        error: 'Requested weight is below batch minimum order',
        code: 'ORDER_WEIGHT_BELOW_MINIMUM',
        details: {
          requested_weight_kg: dto.requested_weight_kg,
          min_order_kg: minOrderKg,
        },
      });
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .insert({
        industry_id: industryId,
        collector_id: batch.collector_id,
        batch_id: batch.id,
        requested_weight_kg: dto.requested_weight_kg,
        offered_price_per_kg: dto.offered_price_per_kg,
        status: 'created',
        notes: dto.notes ?? null,
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create order',
        code: 'ORDER_CREATE_FAILED',
        details: error?.message,
      });
    }

    const { error: batchUpdateError } = await admin
      .from('material_batches')
      .update({ status: 'ordered' })
      .eq('id', batch.id)
      .eq('status', 'available');

    if (batchUpdateError) {
      throw new InternalServerErrorException({
        error: 'Failed to update material batch after order creation',
        code: 'BATCH_STATUS_UPDATE_FAILED',
        details: batchUpdateError.message,
      });
    }

    this.traceabilityService.emitEvent({
      eventType: 'order_created',
      entityType: 'order',
      entityId: data.id,
      actorId: industryId,
      actorRole: 'industry',
      newStatus: 'created',
      linkedEntityType: 'material_batch',
      linkedEntityId: batch.id,
      metadata: {
        collectorId: batch.collector_id,
        requestedWeightKg: dto.requested_weight_kg,
        offeredPricePerKg: dto.offered_price_per_kg,
      },
    });

    return this.getOrder(data.id, industryId, 'industry');
  }

  async getOrder(
    orderId: string,
    requesterId: string,
    role: UserRole,
  ): Promise<OrderWithDetails> {
    const order = await this.fetchOrderWithBatch(orderId);

    if (!order || !this.canAccessOrder(order, requesterId, role)) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    return this.mapOrderWithDetails(order);
  }

  async listOrders(
    requesterId: string,
    role: UserRole,
    status?: OrderStatus,
  ): Promise<OrderWithDetails[]> {
    if (role !== 'industry' && role !== 'collector') {
      throw new ForbiddenException({
        error: 'Role is not allowed to list orders',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('orders')
      .select(ORDER_WITH_BATCH_SELECT)
      .order('created_at', { ascending: false });

    if (role === 'industry') {
      query = query.eq('industry_id', requesterId);
    } else {
      query = query.eq('collector_id', requesterId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load orders',
        code: 'ORDER_LIST_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) =>
      this.mapOrderWithDetails(row as OrderWithBatchJoinRow),
    );
  }

  async transitionOrderStatus(
    orderId: string,
    actorId: string,
    role: UserRole,
    toStatus: OrderStatus,
    data: TransitionOrderStatusData = {},
  ): Promise<OrderWithDetails> {
    const order = await this.fetchOrderRow(orderId);

    if (!order || !this.canAccessOrder(order, actorId, role)) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    const currentStatus = order.status as OrderStatus;

    if (!validateOrderStatusTransition(currentStatus, toStatus)) {
      throw new BadRequestException({
        error: `Invalid order transition from '${currentStatus}' to '${toStatus}'`,
        code: 'INVALID_ORDER_TRANSITION',
      });
    }

    if (!this.canActorTransition(role, currentStatus, toStatus)) {
      throw new ForbiddenException({
        error: `Role '${role}' is not allowed to perform this order transition`,
        code: 'INSUFFICIENT_ROLE',
      });
    }

    if (toStatus === 'rejected' && !data.cancel_reason?.trim()) {
      throw new BadRequestException({
        error: 'Rejection reason is required',
        code: 'ORDER_REJECT_REASON_REQUIRED',
      });
    }

    if (toStatus === 'accepted') {
      this.validateAcceptedTransitionData(data);
    }

    const transitionedAt = new Date().toISOString();
    const updatePayload = this.buildStatusUpdatePayload(
      toStatus,
      data,
      transitionedAt,
    );

    await this.persistOrderStatusUpdate(orderId, currentStatus, updatePayload);

    if (toStatus === 'cancelled') {
      this.traceabilityService.emitEvent({
        eventType: 'order_cancelled',
        entityType: 'order',
        entityId: orderId,
        actorId,
        actorRole: role,
        previousStatus: currentStatus,
        newStatus: 'cancelled',
        metadata: {
          cancelReason: data.cancel_reason ?? null,
        },
      });
    }

    if (toStatus === 'completed') {
      await this.materialBatchService.transitionBatchStatus(
        order.batch_id,
        order.collector_id,
        'sold',
      );
    }

    return this.getOrder(orderId, actorId, role);
  }

  private async fetchBatchForOrder(
    batchId: string,
  ): Promise<BatchOrderRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .select(
        'id, collector_id, name, category_id, total_weight_kg, price_per_kg, min_order_kg, status, city, province',
      )
      .eq('id', batchId)
      .maybeSingle<BatchOrderRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batch for order',
        code: 'MATERIAL_BATCH_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchOrderRow(orderId: string): Promise<OrderRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', orderId)
      .maybeSingle<OrderRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load order',
        code: 'ORDER_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchOrderWithBatch(
    orderId: string,
  ): Promise<OrderWithBatchJoinRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select(ORDER_WITH_BATCH_SELECT)
      .eq('id', orderId)
      .maybeSingle<OrderWithBatchJoinRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load order details',
        code: 'ORDER_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private canAccessOrder(
    order: OrderRow,
    requesterId: string,
    role: UserRole,
  ): boolean {
    if (role === 'industry') {
      return order.industry_id === requesterId;
    }

    if (role === 'collector') {
      return order.collector_id === requesterId;
    }

    return false;
  }

  private canActorTransition(
    role: TransitionActorRole,
    from: OrderStatus,
    to: OrderStatus,
  ): boolean {
    if (role === 'system') {
      return SYSTEM_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
    }

    if (role === 'industry') {
      return INDUSTRY_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
    }

    if (role === 'collector') {
      return COLLECTOR_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
    }

    return false;
  }

  private validateAcceptedTransitionData(
    data: TransitionOrderStatusData,
  ): void {
    if (
      data.final_price_per_kg === undefined ||
      data.final_weight_kg === undefined
    ) {
      throw new BadRequestException({
        error: 'Accepted orders require final price and final weight',
        code: 'ORDER_ACCEPT_DATA_REQUIRED',
      });
    }

    if (data.final_price_per_kg < 0 || data.final_weight_kg <= 0) {
      throw new BadRequestException({
        error: 'Final price and weight must be valid positive values',
        code: 'ORDER_ACCEPT_DATA_INVALID',
      });
    }
  }

  private buildStatusUpdatePayload(
    toStatus: OrderStatus,
    data: TransitionOrderStatusData,
    transitionedAt: string,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      status: toStatus,
    };

    if (toStatus === 'accepted') {
      const finalPricePerKg = data.final_price_per_kg as number;
      const finalWeightKg = data.final_weight_kg as number;

      payload.final_price_per_kg = finalPricePerKg;
      payload.final_weight_kg = finalWeightKg;
      payload.total_amount = Math.round(finalPricePerKg * finalWeightKg);
      payload.accepted_at = transitionedAt;
    }

    if (toStatus === 'rejected') {
      payload.rejected_at = transitionedAt;
      payload.cancel_reason = data.cancel_reason ?? null;
    }

    if (toStatus === 'cancelled') {
      payload.cancelled_at = transitionedAt;
      payload.cancel_reason = data.cancel_reason ?? null;
    }

    if (toStatus === 'completed') {
      payload.completed_at = transitionedAt;
    }

    return payload;
  }

  private async persistOrderStatusUpdate(
    orderId: string,
    currentStatus: OrderStatus,
    updatePayload: Record<string, unknown>,
  ): Promise<void> {
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
        error: 'Failed to update order status',
        code: 'ORDER_STATUS_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Order status changed before update could complete',
        code: 'INVALID_ORDER_TRANSITION',
      });
    }
  }

  private mapOrder(row: OrderRow): Order {
    return {
      id: row.id,
      industry_id: row.industry_id,
      collector_id: row.collector_id,
      batch_id: row.batch_id,
      requested_weight_kg: Number(row.requested_weight_kg),
      final_weight_kg:
        row.final_weight_kg === null ? null : Number(row.final_weight_kg),
      offered_price_per_kg: Number(row.offered_price_per_kg),
      final_price_per_kg:
        row.final_price_per_kg === null ? null : Number(row.final_price_per_kg),
      total_amount: row.total_amount === null ? null : Number(row.total_amount),
      status: row.status as OrderStatus,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      accepted_at: row.accepted_at,
      rejected_at: row.rejected_at,
      cancelled_at: row.cancelled_at,
      completed_at: row.completed_at,
      cancel_reason: row.cancel_reason,
    };
  }

  private mapOrderWithDetails(row: OrderWithBatchJoinRow): OrderWithDetails {
    const batchRow = Array.isArray(row.batch) ? row.batch[0] : row.batch;

    if (!batchRow) {
      throw new InternalServerErrorException({
        error: 'Order is missing linked material batch',
        code: 'ORDER_BATCH_MISSING',
      });
    }

    const batch: OrderBatchSummary = {
      id: batchRow.id,
      name: batchRow.name,
      category_id: batchRow.category_id,
      total_weight_kg: Number(batchRow.total_weight_kg),
      price_per_kg: Number(batchRow.price_per_kg),
      min_order_kg: Number(batchRow.min_order_kg),
      status: batchRow.status,
      city: batchRow.city,
      province: batchRow.province,
    };

    return {
      ...this.mapOrder(row),
      batch,
    };
  }
}
