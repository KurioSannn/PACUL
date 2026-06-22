import { PdfGenerator } from '../src/modules/reports/pdf-generator';
import { ExcelGenerator } from '../src/modules/reports/excel-generator';
import { ReportDataService } from '../src/modules/reports/report-data.service';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { createEmptyStore, createSupabaseMock } from './helpers/supabase-mock';
import { COLLECTOR_ID, INDUSTRY_ID } from './helpers/fixtures';

describe('Reports export smoke (e2e)', () => {
  const mockImpact = {
    total_waste_submitted_kg: 1250,
    total_waste_collected_kg: 980,
    total_material_produced_kg: 820,
    total_material_sold_kg: 640,
    total_transactions: 42,
    total_transaction_value_idr: 12500000,
    total_pickups_completed: 38,
    total_route_distance_km: 142.5,
    total_route_cost_idr: 890000,
    estimated_co2_saved_kg: 890,
    estimated_economic_value_idr: 4200000,
    active_households: 120,
    active_collectors: 8,
    active_industries: 5,
    top_categories: [
      {
        category_name: 'Botol PET',
        weight_kg: 420,
        percentage: 33.6,
      },
    ],
  };

  const mockSummary = {
    role: 'collector' as const,
    counts: {
      active_claims: 2,
      planned_routes: 1,
      ongoing_routes: 0,
      available_batches: 3,
      completed_pickups: 12,
    },
    weights: {
      total_kg_collected: 240,
      material_stock_kg: 80,
    },
    distances: {
      total_route_distance_km: 42,
      today_planned_distance_km: 8,
    },
    costs: {
      total_estimated_route_cost_idr: 180000,
      today_estimated_route_cost_idr: 35000,
    },
    ratings: {
      average: 4.5,
      count: 10,
    },
    recent_claims: [],
    recent_routes: [],
    recent_material_batches: [],
  };

  let pdfGenerator: PdfGenerator;
  let excelGenerator: ExcelGenerator;

  beforeEach(() => {
    const store = createEmptyStore();
    store.transactions.push({
      id: 'txn-1',
      order_id: 'order-1',
      industry_id: INDUSTRY_ID,
      collector_id: COLLECTOR_ID,
      batch_id: 'batch-1',
      amount: 33000,
      status: 'completed',
      payment_method: 'transfer',
      payment_reference: 'REF-001',
      completed_at: '2026-06-22T10:00:00.000Z',
      created_at: '2026-06-22T09:00:00.000Z',
    });
    store.material_batches.push({
      id: 'batch-1',
      collector_id: COLLECTOR_ID,
      category_id: 'cat-1',
      name: 'PET Batch',
      status: 'available',
      total_weight_kg: 50,
      price_per_kg: 3500,
      city: 'Jakarta',
      created_at: '2026-06-20T08:00:00.000Z',
      published_at: '2026-06-21T08:00:00.000Z',
    });
    store.material_batch_sources.push({
      batch_id: 'batch-1',
      listing_id: 'listing-1',
      actual_weight_kg: 50,
      notes: null,
      created_at: '2026-06-20T07:00:00.000Z',
    });

    const supabase = createSupabaseMock(store);

    const reportDataService = {
      getPlatformImpact: jest.fn().mockResolvedValue(mockImpact),
    } as unknown as ReportDataService;

    const dashboardService = {
      getHouseholdSummary: jest.fn().mockResolvedValue(mockSummary),
      getCollectorSummary: jest.fn().mockResolvedValue(mockSummary),
      getIndustrySummary: jest.fn().mockResolvedValue(mockSummary),
    } as unknown as DashboardService;

    pdfGenerator = new PdfGenerator(reportDataService, dashboardService);
    excelGenerator = new ExcelGenerator(supabase);
  });

  it('generateImpactReport returns PDF buffer starting with %PDF', async () => {
    const buffer = await pdfGenerator.generateImpactReport(
      COLLECTOR_ID,
      'collector',
      {},
    );

    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('generateTransactionReport returns non-empty Excel buffer', async () => {
    const buffer = await excelGenerator.generateTransactionReport(
      COLLECTOR_ID,
      'collector',
      {},
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
  });

  it('generateMaterialReport returns non-empty Excel buffer', async () => {
    const buffer = await excelGenerator.generateMaterialReport(
      COLLECTOR_ID,
      {},
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
  });
});
