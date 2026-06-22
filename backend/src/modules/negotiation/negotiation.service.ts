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
import type { OrderStatus } from '../orders/orders.types';
import type { UserRole } from '../profiles/profiles.types';
import type { CancelNegotiationDto } from './dto/cancel-negotiation.dto';
import type { SendOfferDto } from './dto/send-offer.dto';
import type { SendTextMessageDto } from './dto/send-text-message.dto';
import type {
  NegotiationMessage,
  NegotiationMessageType,
  NegotiationOffer,
  NegotiationThread,
  NegotiationThreadStatus,
  NegotiationThreadWithDetails,
} from './negotiation.types';
import { AuditService } from '../notifications/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { TraceabilityService } from '../traceability/traceability.service';

/**
 * Multi-write negotiation flows run as ordered steps. If a later step fails,
 * earlier steps are compensated with best-effort rollback (delete inserted rows
 * or revert status fields). Supabase JS does not expose transactions here.
 */
interface CompensationStep {
  label: string;
  run: () => Promise<void>;
}

interface OrderNegotiationRow {
  id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  status: string;
  requested_weight_kg: number | string;
  offered_price_per_kg: number | string;
}

interface BatchNegotiationRow {
  id: string;
  status: string;
  total_weight_kg: number | string;
  min_order_kg: number | string;
}

interface ThreadRow {
  id: string;
  order_id: string;
  industry_id: string;
  collector_id: string;
  status: string;
  last_offer_by: string | null;
  last_offer_price_per_kg: number | string | null;
  last_offer_weight_kg: number | string | null;
  agreed_price_per_kg: number | string | null;
  agreed_weight_kg: number | string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  message_type: string;
  content: string | null;
  offer_price_per_kg: number | string | null;
  offer_weight_kg: number | string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface OfferRow {
  id: string;
  thread_id: string;
  message_id: string | null;
  offered_by: string;
  price_per_kg: number | string;
  weight_kg: number | string;
  status: string;
  created_at: string;
}

const THREAD_SELECT = `
  id,
  order_id,
  industry_id,
  collector_id,
  status,
  last_offer_by,
  last_offer_price_per_kg,
  last_offer_weight_kg,
  agreed_price_per_kg,
  agreed_weight_kg,
  expires_at,
  created_at,
  updated_at
`;

const MESSAGE_SELECT = `
  id,
  thread_id,
  sender_id,
  message_type,
  content,
  offer_price_per_kg,
  offer_weight_kg,
  metadata,
  created_at
`;

const OFFER_SELECT = `
  id,
  thread_id,
  message_id,
  offered_by,
  price_per_kg,
  weight_kg,
  status,
  created_at
`;

const NEGOTIATION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_THREAD_STATUSES: readonly NegotiationThreadStatus[] = [
  'open',
  'countered',
];
const TERMINAL_THREAD_STATUSES: readonly NegotiationThreadStatus[] = [
  'accepted',
  'cancelled',
  'expired',
];

@Injectable()
export class NegotiationService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly traceabilityService: TraceabilityService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async startNegotiation(
    orderId: string,
    industryId: string,
  ): Promise<NegotiationThreadWithDetails> {
    const order = await this.fetchOrderForNegotiation(orderId);

    if (!order) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    if (order.industry_id !== industryId) {
      throw new ForbiddenException({
        error: 'Only the ordering industry can start negotiation',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    if (order.status !== 'created' && order.status !== 'negotiating') {
      throw new BadRequestException({
        error: 'Negotiation can only start for created or negotiating orders',
        code: 'NEGOTIATION_START_INVALID_ORDER',
      });
    }

    const existingThread = await this.fetchThreadByOrderId(orderId);

    if (existingThread) {
      if (
        TERMINAL_THREAD_STATUSES.includes(
          existingThread.status as NegotiationThreadStatus,
        )
      ) {
        throw new BadRequestException({
          error: 'Negotiation thread is no longer active',
          code: 'NEGOTIATION_INVALID_STATE',
        });
      }

      await this.refreshThreadExpiry(existingThread.id);
      this.logNegotiationAudit('negotiation.started', {
        orderId,
        threadId: existingThread.id,
        actorId: industryId,
        resumed: true,
      });
      return this.getThread(existingThread.id, industryId);
    }

    const expiresAt = this.buildExpiryTimestamp();
    let createdThreadId: string | null = null;
    let createdMessageId: string | null = null;

    try {
      createdThreadId = await this.insertThread({
        orderId,
        industryId: order.industry_id,
        collectorId: order.collector_id,
        expiresAt,
      });

      createdMessageId = await this.insertSystemMessage({
        threadId: createdThreadId,
        senderId: industryId,
        content: 'Negosiasi dimulai',
      });

      if (order.status === 'created') {
        await this.updateOrderStatus(orderId, 'created', {
          status: 'negotiating',
        });
      }

      this.logNegotiationAudit('negotiation.started', {
        orderId,
        threadId: createdThreadId,
        actorId: industryId,
        resumed: false,
      });

      this.traceabilityService.emitEvent({
        eventType: 'negotiation_started',
        entityType: 'negotiation_thread',
        entityId: createdThreadId,
        actorId: industryId,
        actorRole: 'industry',
        newStatus: 'open',
        linkedEntityType: 'order',
        linkedEntityId: orderId,
      });

      return this.getThread(createdThreadId, industryId);
    } catch (error) {
      await this.runCompensations([
        {
          label: 'delete-start-message',
          run: async () => {
            if (createdMessageId) {
              await this.deleteMessage(createdMessageId);
            }
          },
        },
        {
          label: 'delete-start-thread',
          run: async () => {
            if (createdThreadId) {
              await this.deleteThread(createdThreadId);
            }
          },
        },
      ]);
      throw error;
    }
  }

  async sendOffer(
    threadId: string,
    senderId: string,
    role: UserRole,
    dto: SendOfferDto,
  ): Promise<NegotiationThreadWithDetails> {
    const thread = await this.fetchThreadById(threadId);

    if (!thread) {
      throw new NotFoundException({
        error: 'Negotiation thread not found',
        code: 'NEGOTIATION_THREAD_NOT_FOUND',
      });
    }

    this.assertPartyAccess(thread, senderId);
    this.assertActiveThread(thread);
    this.assertThreadNotExpired(thread);

    const messageType = this.resolveOfferMessageType(thread, senderId, role);
    const order = await this.fetchOrderForNegotiation(thread.order_id);

    if (!order) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    await this.assertOfferWeightWithinBatch(order.batch_id, dto.weight_kg);

    let createdMessageId: string | null = null;
    let createdOfferId: string | null = null;
    const previousThreadSnapshot = this.snapshotThread(thread);

    try {
      createdMessageId = await this.insertOfferMessage({
        threadId,
        senderId,
        messageType,
        pricePerKg: dto.price_per_kg,
        weightKg: dto.weight_kg,
      });

      createdOfferId = await this.insertOffer({
        threadId,
        messageId: createdMessageId,
        offeredBy: senderId,
        pricePerKg: dto.price_per_kg,
        weightKg: dto.weight_kg,
      });

      await this.counterPendingOffers(threadId, createdOfferId);
      await this.updateThreadOfferState(threadId, thread.status, {
        last_offer_by: senderId,
        last_offer_price_per_kg: dto.price_per_kg,
        last_offer_weight_kg: dto.weight_kg,
        status: 'countered',
      });

      this.traceabilityService.emitEvent({
        eventType:
          messageType === 'counter_offer' ? 'counter_offer_sent' : 'offer_sent',
        entityType: 'negotiation_thread',
        entityId: threadId,
        actorId: senderId,
        actorRole: role,
        newStatus: 'countered',
        linkedEntityType: 'order',
        linkedEntityId: thread.order_id,
        metadata: {
          pricePerKg: dto.price_per_kg,
          weightKg: dto.weight_kg,
          messageType,
        },
      });

      this.logNegotiationAudit('negotiation.offer_sent', {
        threadId,
        orderId: thread.order_id,
        actorId: senderId,
        actorRole: role,
        messageType,
        pricePerKg: dto.price_per_kg,
        weightKg: dto.weight_kg,
      });

      const counterPartyId = this.resolveCounterPartyId(thread, senderId);
      this.notificationService.createNotification({
        userId: counterPartyId,
        type: 'negotiation_offer',
        title: 'Penawaran negosiasi baru',
        message: `Anda menerima penawaran Rp ${dto.price_per_kg}/kg untuk ${dto.weight_kg} kg.`,
        data: {
          threadId,
          orderId: thread.order_id,
          senderId,
          pricePerKg: dto.price_per_kg,
          weightKg: dto.weight_kg,
          messageType,
        },
      });

      return this.getThread(threadId, senderId);
    } catch (error) {
      await this.runCompensations([
        {
          label: 'restore-thread-offer-state',
          run: async () => {
            await this.restoreThreadSnapshot(threadId, previousThreadSnapshot);
          },
        },
        {
          label: 'delete-created-offer',
          run: async () => {
            if (createdOfferId) {
              await this.deleteOffer(createdOfferId);
            }
          },
        },
        {
          label: 'delete-created-offer-message',
          run: async () => {
            if (createdMessageId) {
              await this.deleteMessage(createdMessageId);
            }
          },
        },
      ]);
      throw error;
    }
  }

  async acceptOffer(
    threadId: string,
    acceptorId: string,
  ): Promise<NegotiationThreadWithDetails> {
    const thread = await this.fetchThreadById(threadId);

    if (!thread) {
      throw new NotFoundException({
        error: 'Negotiation thread not found',
        code: 'NEGOTIATION_THREAD_NOT_FOUND',
      });
    }

    this.assertPartyAccess(thread, acceptorId);
    this.assertActiveThread(thread);
    this.assertThreadNotExpired(thread);

    if (!thread.last_offer_by || thread.last_offer_by === acceptorId) {
      throw new BadRequestException({
        error: 'Cannot accept your own offer',
        code: 'NEGOTIATION_CANNOT_ACCEPT_OWN_OFFER',
      });
    }

    const pendingOffer = await this.fetchLatestPendingOffer(threadId);

    if (!pendingOffer) {
      throw new BadRequestException({
        error: 'No pending offer available to accept',
        code: 'NEGOTIATION_NO_PENDING_OFFER',
      });
    }

    const pricePerKg = Number(pendingOffer.price_per_kg);
    const weightKg = Number(pendingOffer.weight_kg);
    const totalAmount = Math.round(pricePerKg * weightKg);
    const acceptedAt = new Date().toISOString();
    const previousThreadSnapshot = this.snapshotThread(thread);
    let acceptedMessageId: string | null = null;

    try {
      await this.updateOfferStatus(pendingOffer.id, 'pending', 'accepted');

      await this.updateThreadOfferState(threadId, thread.status, {
        agreed_price_per_kg: pricePerKg,
        agreed_weight_kg: weightKg,
        status: 'accepted',
      });

      acceptedMessageId = await this.insertSystemMessage({
        threadId,
        senderId: acceptorId,
        content: 'Penawaran diterima',
        messageType: 'accepted',
      });

      const order = await this.fetchOrderForNegotiation(thread.order_id);

      if (!order) {
        throw new NotFoundException({
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
        });
      }

      if (
        !validateOrderStatusTransition(order.status as OrderStatus, 'accepted')
      ) {
        throw new BadRequestException({
          error: 'Order cannot be accepted from its current status',
          code: 'INVALID_ORDER_TRANSITION',
        });
      }

      await this.updateOrderStatus(thread.order_id, order.status, {
        status: 'accepted',
        final_price_per_kg: pricePerKg,
        final_weight_kg: weightKg,
        total_amount: totalAmount,
        accepted_at: acceptedAt,
      });

      this.traceabilityService.emitEvent({
        eventType: 'deal_accepted',
        entityType: 'negotiation_thread',
        entityId: threadId,
        actorId: acceptorId,
        newStatus: 'accepted',
        linkedEntityType: 'order',
        linkedEntityId: thread.order_id,
        metadata: {
          pricePerKg,
          weightKg,
          totalAmount,
        },
      });

      this.logNegotiationAudit('negotiation.accepted', {
        threadId,
        orderId: thread.order_id,
        actorId: acceptorId,
        pricePerKg,
        weightKg,
        totalAmount,
        offerId: pendingOffer.id,
      });

      this.notificationService.createNotification({
        userId: thread.industry_id,
        type: 'negotiation_accepted',
        title: 'Penawaran diterima',
        message: `Kesepakatan tercapai: Rp ${pricePerKg}/kg × ${weightKg} kg (total Rp ${totalAmount}).`,
        data: {
          threadId,
          orderId: thread.order_id,
          acceptorId,
          pricePerKg,
          weightKg,
          totalAmount,
        },
      });

      this.notificationService.createNotification({
        userId: thread.collector_id,
        type: 'negotiation_accepted',
        title: 'Penawaran diterima',
        message: `Kesepakatan tercapai: Rp ${pricePerKg}/kg × ${weightKg} kg (total Rp ${totalAmount}).`,
        data: {
          threadId,
          orderId: thread.order_id,
          acceptorId,
          pricePerKg,
          weightKg,
          totalAmount,
        },
      });

      return this.getThread(threadId, acceptorId);
    } catch (error) {
      await this.runCompensations([
        {
          label: 'revert-order-acceptance',
          run: async () => {
            const order = await this.fetchOrderForNegotiation(thread.order_id);
            if (order?.status === 'accepted') {
              await this.updateOrderStatus(thread.order_id, 'accepted', {
                status: 'negotiating',
                final_price_per_kg: null,
                final_weight_kg: null,
                total_amount: null,
                accepted_at: null,
              });
            }
          },
        },
        {
          label: 'delete-accepted-message',
          run: async () => {
            if (acceptedMessageId) {
              await this.deleteMessage(acceptedMessageId);
            }
          },
        },
        {
          label: 'restore-thread-accept-state',
          run: async () => {
            await this.restoreThreadSnapshot(threadId, previousThreadSnapshot);
          },
        },
        {
          label: 'revert-offer-accepted-status',
          run: async () => {
            await this.updateOfferStatus(
              pendingOffer.id,
              'accepted',
              'pending',
            );
          },
        },
      ]);
      throw error;
    }
  }

  async cancelNegotiation(
    threadId: string,
    actorId: string,
    dto: CancelNegotiationDto = {},
  ): Promise<NegotiationThreadWithDetails> {
    const thread = await this.fetchThreadById(threadId);

    if (!thread) {
      throw new NotFoundException({
        error: 'Negotiation thread not found',
        code: 'NEGOTIATION_THREAD_NOT_FOUND',
      });
    }

    this.assertPartyAccess(thread, actorId);

    if (
      TERMINAL_THREAD_STATUSES.includes(
        thread.status as NegotiationThreadStatus,
      )
    ) {
      throw new BadRequestException({
        error: 'Negotiation thread is already closed',
        code: 'NEGOTIATION_INVALID_STATE',
      });
    }

    const order = await this.fetchOrderForNegotiation(thread.order_id);

    if (!order) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    const batch = await this.fetchBatchForNegotiation(order.batch_id);
    const cancelledAt = new Date().toISOString();
    const previousThreadSnapshot = this.snapshotThread(thread);
    let cancelMessageId: string | null = null;

    try {
      await this.cancelPendingOffers(threadId);
      await this.updateThreadOfferState(threadId, thread.status, {
        status: 'cancelled',
      });

      cancelMessageId = await this.insertSystemMessage({
        threadId,
        senderId: actorId,
        content: dto.reason?.trim()
          ? `Negosiasi dibatalkan: ${dto.reason.trim()}`
          : 'Negosiasi dibatalkan',
        messageType: 'cancelled',
        metadata: dto.reason ? { reason: dto.reason } : {},
      });

      if (
        validateOrderStatusTransition(order.status as OrderStatus, 'cancelled')
      ) {
        await this.updateOrderStatus(thread.order_id, order.status, {
          status: 'cancelled',
          cancelled_at: cancelledAt,
          cancel_reason: dto.reason?.trim() ?? null,
        });
      }

      if (batch && ['ordered', 'negotiating'].includes(batch.status)) {
        if (
          validateMaterialBatchStatusTransition(
            batch.status as 'ordered',
            'available',
          )
        ) {
          await this.updateBatchStatus(batch.id, batch.status, 'available');
        }
      }

      this.logNegotiationAudit('negotiation.cancelled', {
        threadId,
        orderId: thread.order_id,
        actorId,
        reason: dto.reason?.trim() ?? null,
      });

      return this.getThread(threadId, actorId);
    } catch (error) {
      await this.runCompensations([
        {
          label: 'restore-batch-status',
          run: async () => {
            if (batch) {
              const current = await this.fetchBatchForNegotiation(batch.id);
              if (current?.status === 'available') {
                await this.updateBatchStatus(
                  batch.id,
                  'available',
                  batch.status,
                );
              }
            }
          },
        },
        {
          label: 'revert-order-cancel',
          run: async () => {
            const currentOrder = await this.fetchOrderForNegotiation(
              thread.order_id,
            );
            if (currentOrder?.status === 'cancelled') {
              await this.updateOrderStatus(thread.order_id, 'cancelled', {
                status: order.status,
                cancelled_at: null,
                cancel_reason: null,
              });
            }
          },
        },
        {
          label: 'delete-cancel-message',
          run: async () => {
            if (cancelMessageId) {
              await this.deleteMessage(cancelMessageId);
            }
          },
        },
        {
          label: 'restore-thread-cancel-state',
          run: async () => {
            await this.restoreThreadSnapshot(threadId, previousThreadSnapshot);
            await this.restorePendingOffersAfterCancel(threadId);
          },
        },
      ]);
      throw error;
    }
  }

  async getThread(
    threadId: string,
    requesterId: string,
  ): Promise<NegotiationThreadWithDetails> {
    const thread = await this.fetchThreadById(threadId);

    if (!thread) {
      throw new NotFoundException({
        error: 'Negotiation thread not found',
        code: 'NEGOTIATION_THREAD_NOT_FOUND',
      });
    }

    this.assertPartyAccess(thread, requesterId);

    const [messages, offers] = await Promise.all([
      this.fetchThreadMessagesInternal(threadId),
      this.fetchThreadOffers(threadId),
    ]);

    return {
      ...this.mapThread(thread),
      messages,
      offers,
    };
  }

  async getThreadMessages(
    threadId: string,
    requesterId: string,
    limit = 50,
    before?: string,
  ): Promise<NegotiationMessage[]> {
    const thread = await this.fetchThreadById(threadId);

    if (!thread) {
      throw new NotFoundException({
        error: 'Negotiation thread not found',
        code: 'NEGOTIATION_THREAD_NOT_FOUND',
      });
    }

    this.assertPartyAccess(thread, requesterId);

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.fetchThreadMessagesInternal(threadId, safeLimit, before);
  }

  async sendTextMessage(
    threadId: string,
    senderId: string,
    dto: SendTextMessageDto,
  ): Promise<NegotiationMessage> {
    const thread = await this.fetchThreadById(threadId);

    if (!thread) {
      throw new NotFoundException({
        error: 'Negotiation thread not found',
        code: 'NEGOTIATION_THREAD_NOT_FOUND',
      });
    }

    this.assertPartyAccess(thread, senderId);
    this.assertActiveThread(thread);
    this.assertThreadNotExpired(thread);

    const messageId = await this.insertSystemMessage({
      threadId,
      senderId,
      content: dto.content.trim(),
      messageType: 'text',
    });

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_messages')
      .select(MESSAGE_SELECT)
      .eq('id', messageId)
      .single<MessageRow>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to load sent negotiation message',
        code: 'NEGOTIATION_MESSAGE_LOAD_FAILED',
        details: error?.message,
      });
    }

    this.logNegotiationAudit('negotiation.text_message_sent', {
      threadId,
      actorId: senderId,
      messageId,
    });

    return this.mapMessage(data);
  }

  async getNegotiationHistory(
    orderId: string,
    requesterId: string,
  ): Promise<NegotiationThreadWithDetails> {
    const order = await this.fetchOrderForNegotiation(orderId);

    if (!order) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    if (
      order.industry_id !== requesterId &&
      order.collector_id !== requesterId
    ) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    const thread = await this.fetchThreadByOrderId(orderId);

    if (!thread) {
      throw new NotFoundException({
        error: 'Negotiation history not found',
        code: 'NEGOTIATION_HISTORY_NOT_FOUND',
      });
    }

    const [messages, offers] = await Promise.all([
      this.fetchThreadMessagesChronological(thread.id),
      this.fetchThreadOffersChronological(thread.id),
    ]);

    return {
      ...this.mapThread(thread),
      messages,
      offers,
    };
  }

  private resolveOfferMessageType(
    thread: ThreadRow,
    senderId: string,
    role: UserRole,
  ): 'offer' | 'counter_offer' {
    if (senderId === thread.industry_id) {
      if (role !== 'industry') {
        throw new ForbiddenException({
          error: 'Industry role is required to send an offer',
          code: 'INSUFFICIENT_ROLE',
        });
      }

      return 'offer';
    }

    if (senderId === thread.collector_id) {
      if (role !== 'collector') {
        throw new ForbiddenException({
          error: 'Collector role is required to send a counter-offer',
          code: 'INSUFFICIENT_ROLE',
        });
      }

      return 'counter_offer';
    }

    throw new ForbiddenException({
      error: 'Only negotiation parties can send offers',
      code: 'NEGOTIATION_NOT_PARTY',
    });
  }

  private assertPartyAccess(thread: ThreadRow, requesterId: string): void {
    if (
      thread.industry_id !== requesterId &&
      thread.collector_id !== requesterId
    ) {
      throw new NotFoundException({
        error: 'Negotiation thread not found',
        code: 'NEGOTIATION_THREAD_NOT_FOUND',
      });
    }
  }

  private resolveCounterPartyId(thread: ThreadRow, actorId: string): string {
    return thread.industry_id === actorId
      ? thread.collector_id
      : thread.industry_id;
  }

  private logNegotiationAudit(
    action: string,
    payload: Record<string, unknown>,
  ): void {
    const actorId =
      typeof payload.actorId === 'string' ? payload.actorId : null;
    const actorRole =
      typeof payload.actorRole === 'string' ? payload.actorRole : null;

    this.auditService.logAction({
      actorId,
      actorRole,
      action,
      entityType: 'negotiation_thread',
      entityId: typeof payload.threadId === 'string' ? payload.threadId : null,
      metadata: payload,
    });
  }

  private assertActiveThread(thread: ThreadRow): void {
    if (
      !ACTIVE_THREAD_STATUSES.includes(thread.status as NegotiationThreadStatus)
    ) {
      throw new BadRequestException({
        error: 'Negotiation thread is not open for offers',
        code: 'NEGOTIATION_INVALID_STATE',
      });
    }
  }

  private assertThreadNotExpired(thread: ThreadRow): void {
    if (!thread.expires_at) {
      return;
    }

    if (new Date(thread.expires_at).getTime() <= Date.now()) {
      throw new BadRequestException({
        error: 'Negotiation thread has expired',
        code: 'NEGOTIATION_THREAD_EXPIRED',
      });
    }
  }

  private async assertOfferWeightWithinBatch(
    batchId: string,
    weightKg: number,
  ): Promise<void> {
    const batch = await this.fetchBatchForNegotiation(batchId);

    if (!batch) {
      throw new NotFoundException({
        error: 'Material batch not found',
        code: 'MATERIAL_BATCH_NOT_FOUND',
      });
    }

    const totalWeightKg = Number(batch.total_weight_kg);
    const minOrderKg = Number(batch.min_order_kg);

    if (weightKg > totalWeightKg) {
      throw new BadRequestException({
        error: 'Offer weight exceeds available batch weight',
        code: 'NEGOTIATION_WEIGHT_EXCEEDS_BATCH',
      });
    }

    if (weightKg < minOrderKg) {
      throw new BadRequestException({
        error: 'Offer weight is below batch minimum order',
        code: 'NEGOTIATION_WEIGHT_BELOW_MINIMUM',
      });
    }
  }

  private buildExpiryTimestamp(): string {
    return new Date(Date.now() + NEGOTIATION_EXPIRY_MS).toISOString();
  }

  private snapshotThread(thread: ThreadRow): Record<string, unknown> {
    return {
      status: thread.status,
      last_offer_by: thread.last_offer_by,
      last_offer_price_per_kg: thread.last_offer_price_per_kg,
      last_offer_weight_kg: thread.last_offer_weight_kg,
      agreed_price_per_kg: thread.agreed_price_per_kg,
      agreed_weight_kg: thread.agreed_weight_kg,
    };
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

  private async fetchOrderForNegotiation(
    orderId: string,
  ): Promise<OrderNegotiationRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select(
        'id, industry_id, collector_id, batch_id, status, requested_weight_kg, offered_price_per_kg',
      )
      .eq('id', orderId)
      .maybeSingle<OrderNegotiationRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load order for negotiation',
        code: 'ORDER_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchBatchForNegotiation(
    batchId: string,
  ): Promise<BatchNegotiationRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .select('id, status, total_weight_kg, min_order_kg')
      .eq('id', batchId)
      .maybeSingle<BatchNegotiationRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batch for negotiation',
        code: 'MATERIAL_BATCH_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchThreadById(threadId: string): Promise<ThreadRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_threads')
      .select(THREAD_SELECT)
      .eq('id', threadId)
      .maybeSingle<ThreadRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load negotiation thread',
        code: 'NEGOTIATION_THREAD_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchThreadByOrderId(
    orderId: string,
  ): Promise<ThreadRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_threads')
      .select(THREAD_SELECT)
      .eq('order_id', orderId)
      .maybeSingle<ThreadRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load negotiation thread by order',
        code: 'NEGOTIATION_THREAD_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchLatestPendingOffer(
    threadId: string,
  ): Promise<OfferRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_offers')
      .select(OFFER_SELECT)
      .eq('thread_id', threadId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<OfferRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load pending negotiation offer',
        code: 'NEGOTIATION_OFFER_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchThreadMessagesInternal(
    threadId: string,
    limit?: number,
    before?: string,
  ): Promise<NegotiationMessage[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('negotiation_messages')
      .select(MESSAGE_SELECT)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false });

    if (before) {
      query = query.lt('created_at', before);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load negotiation messages',
        code: 'NEGOTIATION_MESSAGE_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapMessage(row));
  }

  private async fetchThreadOffers(
    threadId: string,
  ): Promise<NegotiationOffer[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_offers')
      .select(OFFER_SELECT)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load negotiation offers',
        code: 'NEGOTIATION_OFFER_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapOffer(row));
  }

  private async fetchThreadMessagesChronological(
    threadId: string,
  ): Promise<NegotiationMessage[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_messages')
      .select(MESSAGE_SELECT)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load negotiation messages',
        code: 'NEGOTIATION_MESSAGE_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapMessage(row));
  }

  private async fetchThreadOffersChronological(
    threadId: string,
  ): Promise<NegotiationOffer[]> {
    return this.fetchThreadOffers(threadId);
  }

  private async insertThread(input: {
    orderId: string;
    industryId: string;
    collectorId: string;
    expiresAt: string;
  }): Promise<string> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_threads')
      .insert({
        order_id: input.orderId,
        industry_id: input.industryId,
        collector_id: input.collectorId,
        status: 'open',
        expires_at: input.expiresAt,
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create negotiation thread',
        code: 'NEGOTIATION_THREAD_CREATE_FAILED',
        details: error?.message,
      });
    }

    return data.id;
  }

  private async refreshThreadExpiry(threadId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin
      .from('negotiation_threads')
      .update({ expires_at: this.buildExpiryTimestamp() })
      .eq('id', threadId);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to refresh negotiation expiry',
        code: 'NEGOTIATION_THREAD_UPDATE_FAILED',
        details: error.message,
      });
    }
  }

  private async insertSystemMessage(input: {
    threadId: string;
    senderId: string;
    content: string;
    messageType?: NegotiationMessageType;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_messages')
      .insert({
        thread_id: input.threadId,
        sender_id: input.senderId,
        message_type: input.messageType ?? 'system',
        content: input.content,
        metadata: input.metadata ?? {},
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create negotiation message',
        code: 'NEGOTIATION_MESSAGE_CREATE_FAILED',
        details: error?.message,
      });
    }

    return data.id;
  }

  private async insertOfferMessage(input: {
    threadId: string;
    senderId: string;
    messageType: 'offer' | 'counter_offer';
    pricePerKg: number;
    weightKg: number;
  }): Promise<string> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_messages')
      .insert({
        thread_id: input.threadId,
        sender_id: input.senderId,
        message_type: input.messageType,
        offer_price_per_kg: input.pricePerKg,
        offer_weight_kg: input.weightKg,
        metadata: {},
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create offer message',
        code: 'NEGOTIATION_MESSAGE_CREATE_FAILED',
        details: error?.message,
      });
    }

    return data.id;
  }

  private async insertOffer(input: {
    threadId: string;
    messageId: string;
    offeredBy: string;
    pricePerKg: number;
    weightKg: number;
  }): Promise<string> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_offers')
      .insert({
        thread_id: input.threadId,
        message_id: input.messageId,
        offered_by: input.offeredBy,
        price_per_kg: input.pricePerKg,
        weight_kg: input.weightKg,
        status: 'pending',
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create negotiation offer',
        code: 'NEGOTIATION_OFFER_CREATE_FAILED',
        details: error?.message,
      });
    }

    return data.id;
  }

  private async counterPendingOffers(
    threadId: string,
    excludeOfferId: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin
      .from('negotiation_offers')
      .update({ status: 'countered' })
      .eq('thread_id', threadId)
      .eq('status', 'pending')
      .neq('id', excludeOfferId);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to counter previous negotiation offers',
        code: 'NEGOTIATION_OFFER_UPDATE_FAILED',
        details: error.message,
      });
    }
  }

  private async cancelPendingOffers(threadId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin
      .from('negotiation_offers')
      .update({ status: 'cancelled' })
      .eq('thread_id', threadId)
      .eq('status', 'pending');

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to cancel pending negotiation offers',
        code: 'NEGOTIATION_OFFER_UPDATE_FAILED',
        details: error.message,
      });
    }
  }

  private async restorePendingOffersAfterCancel(
    threadId: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    await admin
      .from('negotiation_offers')
      .update({ status: 'pending' })
      .eq('thread_id', threadId)
      .eq('status', 'cancelled');
  }

  private async updateThreadOfferState(
    threadId: string,
    currentStatus: string,
    updatePayload: Record<string, unknown>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_threads')
      .update(updatePayload)
      .eq('id', threadId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update negotiation thread',
        code: 'NEGOTIATION_THREAD_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Negotiation thread status changed before update could complete',
        code: 'NEGOTIATION_INVALID_STATE',
      });
    }
  }

  private async restoreThreadSnapshot(
    threadId: string,
    snapshot: Record<string, unknown>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    await admin.from('negotiation_threads').update(snapshot).eq('id', threadId);
  }

  private async updateOfferStatus(
    offerId: string,
    currentStatus: string,
    nextStatus: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_offers')
      .update({ status: nextStatus })
      .eq('id', offerId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update negotiation offer status',
        code: 'NEGOTIATION_OFFER_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Negotiation offer status changed before update could complete',
        code: 'NEGOTIATION_INVALID_STATE',
      });
    }
  }

  private async updateOrderStatus(
    orderId: string,
    currentStatus: string,
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
        error: 'Failed to update order during negotiation',
        code: 'ORDER_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Order status changed before negotiation update could complete',
        code: 'INVALID_ORDER_TRANSITION',
      });
    }
  }

  private async updateBatchStatus(
    batchId: string,
    currentStatus: string,
    nextStatus: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .update({ status: nextStatus })
      .eq('id', batchId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update material batch during negotiation cancel',
        code: 'BATCH_STATUS_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Material batch status changed before cancel could complete',
        code: 'INVALID_BATCH_TRANSITION',
      });
    }
  }

  private async deleteThread(threadId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    await admin.from('negotiation_threads').delete().eq('id', threadId);
  }

  private async deleteMessage(messageId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    await admin.from('negotiation_messages').delete().eq('id', messageId);
  }

  private async deleteOffer(offerId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    await admin.from('negotiation_offers').delete().eq('id', offerId);
  }

  private mapThread(row: ThreadRow): NegotiationThread {
    return {
      id: row.id,
      order_id: row.order_id,
      industry_id: row.industry_id,
      collector_id: row.collector_id,
      status: row.status as NegotiationThread['status'],
      last_offer_by: row.last_offer_by,
      last_offer_price_per_kg:
        row.last_offer_price_per_kg === null
          ? null
          : Number(row.last_offer_price_per_kg),
      last_offer_weight_kg:
        row.last_offer_weight_kg === null
          ? null
          : Number(row.last_offer_weight_kg),
      agreed_price_per_kg:
        row.agreed_price_per_kg === null
          ? null
          : Number(row.agreed_price_per_kg),
      agreed_weight_kg:
        row.agreed_weight_kg === null ? null : Number(row.agreed_weight_kg),
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapMessage(row: MessageRow): NegotiationMessage {
    return {
      id: row.id,
      thread_id: row.thread_id,
      sender_id: row.sender_id,
      message_type: row.message_type as NegotiationMessage['message_type'],
      content: row.content,
      offer_price_per_kg:
        row.offer_price_per_kg === null ? null : Number(row.offer_price_per_kg),
      offer_weight_kg:
        row.offer_weight_kg === null ? null : Number(row.offer_weight_kg),
      metadata: row.metadata ?? {},
      created_at: row.created_at,
    };
  }

  private mapOffer(row: OfferRow): NegotiationOffer {
    return {
      id: row.id,
      thread_id: row.thread_id,
      message_id: row.message_id,
      offered_by: row.offered_by,
      price_per_kg: Number(row.price_per_kg),
      weight_kg: Number(row.weight_kg),
      status: row.status as NegotiationOffer['status'],
      created_at: row.created_at,
    };
  }
}
