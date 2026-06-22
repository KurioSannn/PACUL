import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { validateStatusTransition } from '../../common/config/status-transitions';
import { SupabaseService } from '../../supabase/supabase.service';
import type { UserRole } from '../profiles/profiles.types';
import type { WasteListing, WasteListingStatus } from './waste-listings.types';

export type TransitionActorRole = UserRole | 'system';

export interface TransitionListingMetadata {
  cancel_reason?: string;
}

interface WasteListingRow {
  id: string;
  household_id: string;
  category_id: string;
  classification_id: string | null;
  title: string;
  description: string | null;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  status: WasteListingStatus;
  address: string;
  latitude: number | string;
  longitude: number | string;
  district: string | null;
  city: string | null;
  province: string | null;
  available_from: string | null;
  available_until: string | null;
  notes: string | null;
  pickup_fee: number | string;
  claimed_by: string | null;
  claimed_at: string | null;
  picked_up_at: string | null;
  sorted_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

const LISTING_SELECT = `
  id,
  household_id,
  category_id,
  classification_id,
  title,
  description,
  estimated_weight_kg,
  actual_weight_kg,
  status,
  address,
  latitude,
  longitude,
  district,
  city,
  province,
  available_from,
  available_until,
  notes,
  pickup_fee,
  claimed_by,
  claimed_at,
  picked_up_at,
  sorted_at,
  cancelled_at,
  cancel_reason,
  created_at,
  updated_at
`;

const COLLECTOR_ALLOWED_TRANSITIONS: Partial<
  Record<WasteListingStatus, readonly WasteListingStatus[]>
> = {
  available: ['claimed'],
  claimed: ['pickup_planned', 'picked_up', 'cancelled'],
  pickup_planned: ['picked_up', 'cancelled'],
  picked_up: ['sorting'],
  sorting: ['sorted'],
  sorted: ['converted_to_material'],
};

@Injectable()
export class StatusTransitionService {
  private readonly auditLogger = new Logger('WasteListingStatusAudit');

  constructor(private readonly supabaseService: SupabaseService) {}

  async transitionListingStatus(
    listingId: string,
    toStatus: WasteListingStatus,
    actorId: string,
    actorRole: TransitionActorRole,
    metadata?: TransitionListingMetadata,
  ): Promise<WasteListing> {
    const current = await this.fetchListingRow(listingId);

    if (!current) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    if (!validateStatusTransition(current.status, toStatus)) {
      throw new BadRequestException({
        error: `Invalid status transition from '${current.status}' to '${toStatus}'`,
        code: 'INVALID_TRANSITION',
      });
    }

    if (!this.canActorTransition(actorRole, current.status, toStatus)) {
      throw new ForbiddenException({
        error: `Role '${actorRole}' is not allowed to perform this transition`,
        code: 'INSUFFICIENT_ROLE',
      });
    }

    const transitionedAt = new Date().toISOString();
    const updatePayload = this.buildStatusUpdatePayload(
      toStatus,
      actorId,
      transitionedAt,
      metadata,
    );

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .update(updatePayload)
      .eq('id', listingId)
      .eq('status', current.status)
      .select(LISTING_SELECT)
      .maybeSingle<WasteListingRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to transition waste listing status',
        code: 'LISTING_TRANSITION_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Waste listing status changed before transition could complete',
        code: 'INVALID_TRANSITION',
      });
    }

    const updatedListing = this.mapListing(data);

    this.emitAuditLog({
      listingId,
      fromStatus: current.status,
      toStatus,
      actorId,
      actorRole,
      metadata,
      transitionedAt,
    });

    return updatedListing;
  }

  private canActorTransition(
    actorRole: TransitionActorRole,
    from: WasteListingStatus,
    to: WasteListingStatus,
  ): boolean {
    if (actorRole === 'system') {
      return true;
    }

    if (actorRole === 'household') {
      if (from === 'draft' && (to === 'available' || to === 'cancelled')) {
        return true;
      }

      return from === 'available' && to === 'cancelled';
    }

    if (actorRole === 'collector') {
      return COLLECTOR_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
    }

    return false;
  }

  private buildStatusUpdatePayload(
    toStatus: WasteListingStatus,
    actorId: string,
    transitionedAt: string,
    metadata?: TransitionListingMetadata,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      status: toStatus,
    };

    if (toStatus === 'claimed') {
      payload.claimed_by = actorId;
      payload.claimed_at = transitionedAt;
    }

    if (toStatus === 'picked_up') {
      payload.picked_up_at = transitionedAt;
    }

    if (toStatus === 'sorted') {
      payload.sorted_at = transitionedAt;
    }

    if (toStatus === 'cancelled') {
      payload.cancelled_at = transitionedAt;
      payload.cancel_reason = metadata?.cancel_reason ?? null;
    }

    return payload;
  }

  private async fetchListingRow(id: string): Promise<WasteListing | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(LISTING_SELECT)
      .eq('id', id)
      .maybeSingle<WasteListingRow>();

    if (error || !data) {
      return null;
    }

    return this.mapListing(data);
  }

  private emitAuditLog(payload: {
    listingId: string;
    fromStatus: WasteListingStatus;
    toStatus: WasteListingStatus;
    actorId: string;
    actorRole: TransitionActorRole;
    metadata?: TransitionListingMetadata;
    transitionedAt: string;
  }): void {
    this.auditLogger.log(
      JSON.stringify({
        event: 'waste_listing.status_transition',
        ...payload,
      }),
    );
  }

  private mapListing(row: WasteListingRow): WasteListing {
    return {
      id: row.id,
      household_id: row.household_id,
      category_id: row.category_id,
      classification_id: row.classification_id,
      title: row.title,
      description: row.description,
      estimated_weight_kg: Number(row.estimated_weight_kg),
      actual_weight_kg:
        row.actual_weight_kg === null ? null : Number(row.actual_weight_kg),
      status: row.status,
      address: row.address,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      district: row.district,
      city: row.city,
      province: row.province,
      available_from: row.available_from,
      available_until: row.available_until,
      notes: row.notes,
      pickup_fee: Number(row.pickup_fee ?? 0),
      claimed_by: row.claimed_by,
      claimed_at: row.claimed_at,
      picked_up_at: row.picked_up_at,
      sorted_at: row.sorted_at,
      cancelled_at: row.cancelled_at,
      cancel_reason: row.cancel_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
