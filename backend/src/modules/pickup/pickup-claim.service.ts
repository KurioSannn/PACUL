import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../notifications/audit.service';
import { StatusTransitionService } from '../waste-listings/status-transition.service';
import { TraceabilityService } from '../traceability/traceability.service';
import type { WasteListingStatus } from '../waste-listings/waste-listings.types';
import type {
  PickupClaim,
  PickupClaimStatus,
  UpdatePickupClaimStatusData,
} from './pickup-claim.types';

interface PickupClaimRow {
  id: string;
  listing_id: string;
  collector_id: string;
  status: PickupClaimStatus;
  claimed_at: string;
  pickup_scheduled_at: string | null;
  pickup_completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  route_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WasteListingSummaryRow {
  id: string;
  status: WasteListingStatus;
  category_id: string;
  household_id: string;
}

const PICKUP_CLAIM_SELECT = `
  id,
  listing_id,
  collector_id,
  status,
  claimed_at,
  pickup_scheduled_at,
  pickup_completed_at,
  cancelled_at,
  cancel_reason,
  route_id,
  notes,
  created_at,
  updated_at
`;

const CLAIM_STATUS_TRANSITIONS: Record<
  PickupClaimStatus,
  readonly PickupClaimStatus[]
> = {
  claimed: ['pickup_planned', 'cancelled'],
  pickup_planned: ['picked_up', 'cancelled'],
  picked_up: [],
  cancelled: [],
};

const CLAIM_TO_LISTING_STATUS: Partial<
  Record<PickupClaimStatus, WasteListingStatus>
> = {
  pickup_planned: 'pickup_planned',
  picked_up: 'picked_up',
  cancelled: 'cancelled',
};

@Injectable()
export class PickupClaimService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly statusTransitionService: StatusTransitionService,
    private readonly traceabilityService: TraceabilityService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async claimListing(
    collectorId: string,
    listingId: string,
  ): Promise<PickupClaim> {
    const listing = await this.fetchListingSummary(listingId);

    if (!listing) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    if (listing.status !== 'available') {
      throw new BadRequestException({
        error: 'Only available listings can be claimed',
        code: 'LISTING_NOT_AVAILABLE',
      });
    }

    const handlesCategory = await this.collectorHandlesCategory(
      collectorId,
      listing.category_id,
    );

    if (!handlesCategory) {
      throw new BadRequestException({
        error: 'Collector does not handle this waste category',
        code: 'CATEGORY_NOT_HANDLED',
      });
    }

    const existingClaim = await this.getClaimByListing(listingId);

    if (existingClaim) {
      throw new ConflictException({
        error: 'Listing already has a pickup claim',
        code: 'CLAIM_ALREADY_EXISTS',
      });
    }

    await this.statusTransitionService.transitionListingStatus(
      listingId,
      'claimed',
      collectorId,
      'collector',
    );

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_claims')
      .insert({
        listing_id: listingId,
        collector_id: collectorId,
        status: 'claimed',
      })
      .select(PICKUP_CLAIM_SELECT)
      .single<PickupClaimRow>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create pickup claim',
        code: 'CLAIM_CREATE_FAILED',
        details: error?.message,
      });
    }

    this.traceabilityService.emitEvent({
      eventType: 'pickup_claimed',
      entityType: 'waste_listing',
      entityId: listingId,
      actorId: collectorId,
      actorRole: 'collector',
      previousStatus: 'available',
      newStatus: 'claimed',
      linkedEntityType: 'pickup_claim',
      linkedEntityId: data.id,
    });

    this.auditService.logAction({
      actorId: collectorId,
      actorRole: 'collector',
      action: 'pickup.claimed',
      entityType: 'pickup_claim',
      entityId: data.id,
      metadata: {
        listingId,
        householdId: listing.household_id,
      },
    });

    this.notificationService.createNotification({
      userId: listing.household_id,
      type: 'pickup_claimed',
      title: 'Listing diklaim pengepul',
      message:
        'Pengepul telah mengklaim listing sampah Anda. Pantau status pickup di dashboard.',
      data: {
        listingId,
        claimId: data.id,
        collectorId,
      },
    });

    return this.mapClaim(data);
  }

  async updateClaimStatus(
    claimId: string,
    collectorId: string,
    newStatus: PickupClaimStatus,
    data: UpdatePickupClaimStatusData = {},
  ): Promise<PickupClaim> {
    const claim = await this.fetchClaimById(claimId);

    if (!claim || claim.collector_id !== collectorId) {
      throw new NotFoundException({
        error: 'Pickup claim not found',
        code: 'CLAIM_NOT_FOUND',
      });
    }

    if (claim.status === newStatus) {
      throw new BadRequestException({
        error: 'Pickup claim is already in the requested status',
        code: 'INVALID_CLAIM_TRANSITION',
      });
    }

    if (!CLAIM_STATUS_TRANSITIONS[claim.status].includes(newStatus)) {
      throw new BadRequestException({
        error: `Invalid pickup claim transition from '${claim.status}' to '${newStatus}'`,
        code: 'INVALID_CLAIM_TRANSITION',
      });
    }

    const listingStatus = CLAIM_TO_LISTING_STATUS[newStatus];

    if (listingStatus) {
      await this.statusTransitionService.transitionListingStatus(
        claim.listing_id,
        listingStatus,
        collectorId,
        'collector',
        newStatus === 'cancelled'
          ? { cancel_reason: data.cancel_reason }
          : undefined,
      );
    }

    const transitionedAt = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === 'pickup_planned') {
      updatePayload.pickup_scheduled_at =
        data.pickup_scheduled_at ?? transitionedAt;
    }

    if (newStatus === 'picked_up') {
      updatePayload.pickup_completed_at = transitionedAt;
    }

    if (newStatus === 'cancelled') {
      updatePayload.cancelled_at = transitionedAt;
      updatePayload.cancel_reason = data.cancel_reason ?? null;
    }

    if (data.notes !== undefined) {
      updatePayload.notes = data.notes;
    }

    const admin = this.supabaseService.getAdminClient();
    const { data: updated, error } = await admin
      .from('pickup_claims')
      .update(updatePayload)
      .eq('id', claimId)
      .eq('collector_id', collectorId)
      .eq('status', claim.status)
      .select(PICKUP_CLAIM_SELECT)
      .maybeSingle<PickupClaimRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update pickup claim status',
        code: 'CLAIM_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!updated) {
      throw new BadRequestException({
        error: 'Pickup claim status changed before update could complete',
        code: 'INVALID_CLAIM_TRANSITION',
      });
    }

    return this.mapClaim(updated);
  }

  async getCollectorClaims(
    collectorId: string,
    status?: PickupClaimStatus,
  ): Promise<PickupClaim[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('pickup_claims')
      .select(PICKUP_CLAIM_SELECT)
      .eq('collector_id', collectorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load pickup claims',
        code: 'CLAIM_LIST_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapClaim(row));
  }

  async getClaimByListing(listingId: string): Promise<PickupClaim | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_claims')
      .select(PICKUP_CLAIM_SELECT)
      .eq('listing_id', listingId)
      .maybeSingle<PickupClaimRow>();

    if (error || !data) {
      return null;
    }

    return this.mapClaim(data);
  }

  private async fetchClaimById(claimId: string): Promise<PickupClaim | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_claims')
      .select(PICKUP_CLAIM_SELECT)
      .eq('id', claimId)
      .maybeSingle<PickupClaimRow>();

    if (error || !data) {
      return null;
    }

    return this.mapClaim(data);
  }

  private async fetchListingSummary(
    listingId: string,
  ): Promise<WasteListingSummaryRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select('id, status, category_id, household_id')
      .eq('id', listingId)
      .maybeSingle<WasteListingSummaryRow>();

    if (error || !data) {
      return null;
    }

    return data;
  }

  private async collectorHandlesCategory(
    collectorId: string,
    categoryId: string,
  ): Promise<boolean> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_handled_categories')
      .select('id')
      .eq('collector_id', collectorId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to validate handled category',
        code: 'HANDLED_CATEGORY_VALIDATION_FAILED',
        details: error.message,
      });
    }

    return Boolean(data);
  }

  private mapClaim(row: PickupClaimRow): PickupClaim {
    return {
      id: row.id,
      listing_id: row.listing_id,
      collector_id: row.collector_id,
      status: row.status,
      claimed_at: row.claimed_at,
      pickup_scheduled_at: row.pickup_scheduled_at,
      pickup_completed_at: row.pickup_completed_at,
      cancelled_at: row.cancelled_at,
      cancel_reason: row.cancel_reason,
      route_id: row.route_id,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
