import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { SupabaseService } from '../../supabase/supabase.service';
import type { UserRole } from '../profiles/profiles.types';
import type { ReportExportFilters } from './reports.types';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' },
};

interface TransactionRow {
  id: string;
  order_id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  amount: number | string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  completed_at: string | null;
  created_at: string;
}

interface MaterialBatchRow {
  id: string;
  name: string;
  category_id: string;
  status: string;
  total_weight_kg: number | string;
  price_per_kg: number | string;
  city: string | null;
  created_at: string;
  published_at: string | null;
}

interface MaterialSourceRow {
  batch_id: string;
  listing_id: string;
  actual_weight_kg: number | string;
  notes: string | null;
  created_at: string;
}

interface RouteRow {
  id: string;
  status: string;
  total_distance_km: number | string;
  total_weight_kg: number | string | null;
  estimated_cost: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface RouteStopRow {
  route_id: string;
  sequence_number: number;
  listing_id: string;
  status: string;
  distance_from_previous_km: number | string | null;
  arrived_at: string | null;
  completed_at: string | null;
}

@Injectable()
export class ExcelGenerator {
  constructor(private readonly supabaseService: SupabaseService) {}

  async generateTransactionReport(
    userId: string,
    role: UserRole,
    filters: ReportExportFilters,
  ): Promise<Buffer> {
    const rows = await this.fetchTransactions(userId, role, filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transaksi');

    sheet.columns = [
      { header: 'Transaction ID', key: 'id', width: 38 },
      { header: 'Order ID', key: 'order_id', width: 38 },
      { header: 'Amount (IDR)', key: 'amount', width: 16 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Payment Method', key: 'payment_method', width: 16 },
      { header: 'Payment Reference', key: 'payment_reference', width: 24 },
      { header: 'Completed At', key: 'completed_at', width: 24 },
      { header: 'Created At', key: 'created_at', width: 24 },
    ];

    for (const row of rows) {
      sheet.addRow({
        id: row.id,
        order_id: row.order_id,
        amount: Number(row.amount),
        status: row.status,
        payment_method: row.payment_method,
        payment_reference: row.payment_reference,
        completed_at: row.completed_at,
        created_at: row.created_at,
      });
    }

    this.styleHeaderRow(sheet);
    return this.writeWorkbook(workbook);
  }

  async generateMaterialReport(
    userId: string,
    filters: ReportExportFilters,
  ): Promise<Buffer> {
    const [batches, sources, categories] = await Promise.all([
      this.fetchMaterialBatches(userId, filters),
      this.fetchMaterialSources(userId, filters),
      this.fetchCategoryMap(),
    ]);

    const workbook = new ExcelJS.Workbook();
    const batchSheet = workbook.addWorksheet('Material Batch');

    batchSheet.columns = [
      { header: 'Batch ID', key: 'id', width: 38 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Weight (kg)', key: 'total_weight_kg', width: 14 },
      { header: 'Price/kg (IDR)', key: 'price_per_kg', width: 16 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'Published At', key: 'published_at', width: 24 },
      { header: 'Created At', key: 'created_at', width: 24 },
    ];

    for (const row of batches) {
      batchSheet.addRow({
        id: row.id,
        name: row.name,
        category: categories.get(row.category_id) ?? 'Unknown',
        status: row.status,
        total_weight_kg: Number(row.total_weight_kg),
        price_per_kg: Number(row.price_per_kg),
        city: row.city,
        published_at: row.published_at,
        created_at: row.created_at,
      });
    }

    this.styleHeaderRow(batchSheet);

    const sourceSheet = workbook.addWorksheet('Sumber Material');
    sourceSheet.columns = [
      { header: 'Batch ID', key: 'batch_id', width: 38 },
      { header: 'Listing ID', key: 'listing_id', width: 38 },
      { header: 'Actual Weight (kg)', key: 'actual_weight_kg', width: 18 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Created At', key: 'created_at', width: 24 },
    ];

    for (const row of sources) {
      sourceSheet.addRow({
        batch_id: row.batch_id,
        listing_id: row.listing_id,
        actual_weight_kg: Number(row.actual_weight_kg),
        notes: row.notes,
        created_at: row.created_at,
      });
    }

    this.styleHeaderRow(sourceSheet);
    return this.writeWorkbook(workbook);
  }

  async generateRouteReport(
    userId: string,
    filters: ReportExportFilters,
  ): Promise<Buffer> {
    const routes = await this.fetchRoutes(userId, filters);
    const routeIds = routes.map((route) => route.id);
    const stops = await this.fetchRouteStops(routeIds);

    const workbook = new ExcelJS.Workbook();
    const routeSheet = workbook.addWorksheet('Rute');

    routeSheet.columns = [
      { header: 'Route ID', key: 'id', width: 38 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Distance (km)', key: 'total_distance_km', width: 14 },
      { header: 'Weight (kg)', key: 'total_weight_kg', width: 14 },
      { header: 'Est. Cost (IDR)', key: 'estimated_cost', width: 16 },
      { header: 'Started At', key: 'started_at', width: 24 },
      { header: 'Completed At', key: 'completed_at', width: 24 },
      { header: 'Created At', key: 'created_at', width: 24 },
    ];

    for (const row of routes) {
      routeSheet.addRow({
        id: row.id,
        status: row.status,
        total_distance_km: Number(row.total_distance_km),
        total_weight_kg:
          row.total_weight_kg === null ? null : Number(row.total_weight_kg),
        estimated_cost: row.estimated_cost,
        started_at: row.started_at,
        completed_at: row.completed_at,
        created_at: row.created_at,
      });
    }

    this.styleHeaderRow(routeSheet);

    const stopSheet = workbook.addWorksheet('Stop Detail');
    stopSheet.columns = [
      { header: 'Route ID', key: 'route_id', width: 38 },
      { header: 'Sequence', key: 'sequence_number', width: 10 },
      { header: 'Listing ID', key: 'listing_id', width: 38 },
      { header: 'Status', key: 'status', width: 14 },
      {
        header: 'Distance Prev (km)',
        key: 'distance_from_previous_km',
        width: 18,
      },
      { header: 'Arrived At', key: 'arrived_at', width: 24 },
      { header: 'Completed At', key: 'completed_at', width: 24 },
    ];

    for (const row of stops) {
      stopSheet.addRow({
        route_id: row.route_id,
        sequence_number: row.sequence_number,
        listing_id: row.listing_id,
        status: row.status,
        distance_from_previous_km:
          row.distance_from_previous_km === null
            ? null
            : Number(row.distance_from_previous_km),
        arrived_at: row.arrived_at,
        completed_at: row.completed_at,
      });
    }

    this.styleHeaderRow(stopSheet);
    return this.writeWorkbook(workbook);
  }

  private styleHeaderRow(sheet: ExcelJS.Worksheet): void {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = HEADER_FILL;
  }

  private async writeWorkbook(workbook: ExcelJS.Workbook): Promise<Buffer> {
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async fetchTransactions(
    userId: string,
    role: UserRole,
    filters: ReportExportFilters,
  ): Promise<TransactionRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('transactions').select(
      `
      id,
      order_id,
      industry_id,
      collector_id,
      batch_id,
      amount,
      status,
      payment_method,
      payment_reference,
      completed_at,
      created_at
    `,
    );

    if (role === 'industry') {
      query = query.eq('industry_id', userId);
    } else {
      query = query.eq('collector_id', userId);
    }

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw loadFailed('transactions for excel export', error.message);
    }

    return data ?? [];
  }

  private async fetchMaterialBatches(
    userId: string,
    filters: ReportExportFilters,
  ): Promise<MaterialBatchRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('material_batches')
      .select(
        'id, name, category_id, status, total_weight_kg, price_per_kg, city, created_at, published_at',
      )
      .eq('collector_id', userId);

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw loadFailed('material batches for excel export', error.message);
    }

    return data ?? [];
  }

  private async fetchMaterialSources(
    userId: string,
    filters: ReportExportFilters,
  ): Promise<MaterialSourceRow[]> {
    const batches = await this.fetchMaterialBatches(userId, filters);
    const batchIds = batches.map((batch) => batch.id);

    if (batchIds.length === 0) {
      return [];
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batch_sources')
      .select('batch_id, listing_id, actual_weight_kg, notes, created_at')
      .in('batch_id', batchIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw loadFailed(
        'material batch sources for excel export',
        error.message,
      );
    }

    return data ?? [];
  }

  private async fetchRoutes(
    userId: string,
    filters: ReportExportFilters,
  ): Promise<RouteRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('pickup_routes')
      .select(
        'id, status, total_distance_km, total_weight_kg, estimated_cost, started_at, completed_at, created_at',
      )
      .eq('collector_id', userId);

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw loadFailed('pickup routes for excel export', error.message);
    }

    return data ?? [];
  }

  private async fetchRouteStops(routeIds: string[]): Promise<RouteStopRow[]> {
    if (routeIds.length === 0) {
      return [];
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_route_stops')
      .select(
        'route_id, sequence_number, listing_id, status, distance_from_previous_km, arrived_at, completed_at',
      )
      .in('route_id', routeIds)
      .order('route_id', { ascending: true })
      .order('sequence_number', { ascending: true });

    if (error) {
      throw loadFailed('route stops for excel export', error.message);
    }

    return data ?? [];
  }

  private async fetchCategoryMap(): Promise<Map<string, string>> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_categories')
      .select('id, name');

    if (error) {
      throw loadFailed('categories for excel export', error.message);
    }

    return new Map(
      (data ?? []).map((row: { id: string; name: string }) => [
        row.id,
        row.name,
      ]),
    );
  }
}

function loadFailed(
  resource: string,
  details: string,
): InternalServerErrorException {
  return new InternalServerErrorException({
    error: `Failed to load ${resource}`,
    code: 'REPORT_EXCEL_LOAD_FAILED',
    details,
  });
}
