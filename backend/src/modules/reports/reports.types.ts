import type { UserRole } from '../profiles/profiles.types';

export const REPORT_EXPORT_TYPES = [
  'pdf_impact',
  'excel_transactions',
  'excel_routes',
  'excel_materials',
] as const;

export type ReportExportType = (typeof REPORT_EXPORT_TYPES)[number];

export const REPORT_EXPORT_STATUSES = [
  'pending',
  'completed',
  'failed',
] as const;

export type ReportExportStatus = (typeof REPORT_EXPORT_STATUSES)[number];

export const EXCEL_EXPORT_TYPES = [
  'transactions',
  'materials',
  'routes',
] as const;

export type ExcelExportRequestType = (typeof EXCEL_EXPORT_TYPES)[number];

export interface ReportExportFilters {
  from_date?: string;
  to_date?: string;
  city?: string;
}

export interface ReportExportRecord {
  id: string;
  user_id: string;
  export_type: ReportExportType;
  status: ReportExportStatus;
  file_path: string | null;
  file_size_bytes: number | null;
  filters: ReportExportFilters;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface ReportExportSummary {
  id: string;
  export_type: ReportExportType;
  status: ReportExportStatus;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  file_size_bytes: number | null;
  downloadUrl?: string;
}

export interface ReportDownloadResponse {
  signedUrl: string;
  expiresAt: string;
}

export interface PlatformImpactMetrics {
  total_waste_submitted_kg: number;
  total_waste_collected_kg: number;
  total_material_produced_kg: number;
  total_material_sold_kg: number;
  total_transactions: number;
  total_transaction_value_idr: number;
  total_pickups_completed: number;
  total_route_distance_km: number;
  total_route_cost_idr: number;
  estimated_co2_saved_kg: number;
  estimated_economic_value_idr: number;
  active_households: number;
  active_collectors: number;
  active_industries: number;
  top_categories: Array<{
    category_name: string;
    weight_kg: number;
    percentage: number;
  }>;
}

export interface ReportGenerationContext {
  userId: string;
  role: UserRole;
  filters: ReportExportFilters;
}

export const SIGNED_DOWNLOAD_URL_EXPIRES_SEC = 3600;
export const LIST_EXPORTS_LIMIT = 20;
