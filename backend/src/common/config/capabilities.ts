import type { UserRole } from '../../modules/profiles/profiles.types';

export type HouseholdCapability =
  | 'create_waste_listing'
  | 'view_own_waste_listings'
  | 'view_pickup_status'
  | 'view_material_traceability'
  | 'rate_collector'
  | 'view_own_impact_dashboard'
  | 'export_own_report';

export type CollectorCapability =
  | 'view_available_waste_listings'
  | 'claim_waste_listing'
  | 'create_pickup_route'
  | 'manage_route_status'
  | 'sort_waste_into_material_batch'
  | 'create_material_batch'
  | 'publish_material_listing'
  | 'negotiate_with_industry'
  | 'rate_household'
  | 'rate_industry'
  | 'view_collector_dashboard'
  | 'export_collector_report';

export type IndustryCapability =
  | 'view_material_marketplace'
  | 'create_order'
  | 'negotiate_with_collector'
  | 'complete_transaction'
  | 'rate_collector'
  | 'view_industry_dashboard'
  | 'export_industry_report'
  | 'view_material_traceability';

export type Capability =
  | HouseholdCapability
  | CollectorCapability
  | IndustryCapability;

export type PaculCapabilities = Record<UserRole, readonly Capability[]>;

export const PACUL_CAPABILITIES: PaculCapabilities = {
  household: [
    'create_waste_listing',
    'view_own_waste_listings',
    'view_pickup_status',
    'view_material_traceability',
    'rate_collector',
    'view_own_impact_dashboard',
    'export_own_report',
  ],
  collector: [
    'view_available_waste_listings',
    'claim_waste_listing',
    'create_pickup_route',
    'manage_route_status',
    'sort_waste_into_material_batch',
    'create_material_batch',
    'publish_material_listing',
    'negotiate_with_industry',
    'rate_household',
    'rate_industry',
    'view_collector_dashboard',
    'export_collector_report',
  ],
  industry: [
    'view_material_marketplace',
    'create_order',
    'negotiate_with_collector',
    'complete_transaction',
    'rate_collector',
    'view_industry_dashboard',
    'export_industry_report',
    'view_material_traceability',
  ],
} as const;
