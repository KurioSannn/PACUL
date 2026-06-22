import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { DashboardSummary } from '../dashboard/dashboard.types';
import { DashboardService } from '../dashboard/dashboard.service';
import type { UserRole } from '../profiles/profiles.types';
import { ReportDataService } from './report-data.service';
import type {
  PlatformImpactMetrics,
  ReportExportFilters,
} from './reports.types';

@Injectable()
export class PdfGenerator {
  constructor(
    private readonly reportDataService: ReportDataService,
    private readonly dashboardService: DashboardService,
  ) {}

  async generateImpactReport(
    userId: string,
    role: UserRole,
    filters: ReportExportFilters,
  ): Promise<Buffer> {
    const [impact, roleSummary] = await Promise.all([
      this.reportDataService.getPlatformImpact(filters),
      this.fetchRoleSummary(userId, role),
    ]);

    return this.buildPdf(userId, role, filters, impact, roleSummary);
  }

  private async fetchRoleSummary(
    userId: string,
    role: UserRole,
  ): Promise<DashboardSummary> {
    switch (role) {
      case 'household':
        return this.dashboardService.getHouseholdSummary(userId);
      case 'collector':
        return this.dashboardService.getCollectorSummary(userId);
      case 'industry':
        return this.dashboardService.getIndustrySummary(userId);
    }
  }

  private buildPdf(
    userId: string,
    role: UserRole,
    filters: ReportExportFilters,
    impact: PlatformImpactMetrics,
    roleSummary: DashboardSummary,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderCover(doc, userId, role, filters);
      doc.addPage();
      this.renderPlatformImpact(doc, impact, filters);
      doc.addPage();
      this.renderRoleMetrics(doc, roleSummary);
      doc.addPage();
      this.renderTopCategories(doc, impact.top_categories);
      doc.addPage();
      this.renderNotes(doc);

      doc.end();
    });
  }

  private renderCover(
    doc: PDFKit.PDFDocument,
    userId: string,
    role: UserRole,
    filters: ReportExportFilters,
  ): void {
    doc
      .fontSize(24)
      .text('PACUL Impact Report', { align: 'center' })
      .moveDown(1.5);

    doc.fontSize(12).text(`Generated for: ${userId}`);
    doc.text(`Role: ${role}`);
    doc.text(`Generated at: ${new Date().toISOString()}`);

    if (filters.from_date || filters.to_date || filters.city) {
      doc.moveDown();
      doc.fontSize(11).text('Filters applied:', { underline: true });
      if (filters.from_date) {
        doc.text(`From: ${filters.from_date}`);
      }
      if (filters.to_date) {
        doc.text(`To: ${filters.to_date}`);
      }
      if (filters.city) {
        doc.text(`City: ${filters.city}`);
      }
    }
  }

  private renderPlatformImpact(
    doc: PDFKit.PDFDocument,
    impact: PlatformImpactMetrics,
    filters: ReportExportFilters,
  ): void {
    doc.fontSize(18).text('Platform Impact Summary');
    doc.moveDown(0.5);
    doc.fontSize(10);

    if (filters.city) {
      doc.text(`Scope: listings filtered by city "${filters.city}"`);
      doc.moveDown(0.5);
    }

    const rows: Array<[string, string]> = [
      ['Waste submitted (kg)', String(impact.total_waste_submitted_kg)],
      ['Waste collected (kg)', String(impact.total_waste_collected_kg)],
      ['Material produced (kg)', String(impact.total_material_produced_kg)],
      ['Material sold (kg)', String(impact.total_material_sold_kg)],
      ['Completed transactions', String(impact.total_transactions)],
      [
        'Transaction value (IDR)',
        formatIdr(impact.total_transaction_value_idr),
      ],
      ['Pickups completed', String(impact.total_pickups_completed)],
      ['Route distance (km)', String(impact.total_route_distance_km)],
      ['Route cost (IDR)', formatIdr(impact.total_route_cost_idr)],
      ['Est. CO2 saved (kg)', String(impact.estimated_co2_saved_kg)],
      [
        'Est. economic value (IDR)',
        formatIdr(impact.estimated_economic_value_idr),
      ],
      ['Active households', String(impact.active_households)],
      ['Active collectors', String(impact.active_collectors)],
      ['Active industries', String(impact.active_industries)],
    ];

    for (const [label, value] of rows) {
      doc.text(`${label}: ${value}`);
    }

    doc.moveDown();
    doc
      .fontSize(9)
      .fillColor('#555555')
      .text(
        'CO2 estimate uses recycled material weight × 2.5 kg CO2 per kg (documented approximation for MVP).',
      );
    doc.fillColor('#000000');
  }

  private renderRoleMetrics(
    doc: PDFKit.PDFDocument,
    summary: DashboardSummary,
  ): void {
    doc.fontSize(18).text('Your Role Metrics');
    doc.moveDown(0.5);
    doc.fontSize(10);

    doc.text(`Role: ${summary.role}`);
    doc.moveDown(0.5);

    if (summary.role === 'household') {
      this.renderKeyValueBlock(doc, 'Counts', summary.counts);
      this.renderKeyValueBlock(doc, 'Weights (kg)', summary.weights);
      this.renderKeyValueBlock(doc, 'Costs (IDR)', summary.costs);
      this.renderKeyValueBlock(doc, 'Ratings', summary.ratings);
      return;
    }

    if (summary.role === 'collector') {
      this.renderKeyValueBlock(doc, 'Counts', summary.counts);
      this.renderKeyValueBlock(doc, 'Weights (kg)', summary.weights);
      this.renderKeyValueBlock(doc, 'Distances (km)', summary.distances);
      this.renderKeyValueBlock(doc, 'Costs (IDR)', summary.costs);
      this.renderKeyValueBlock(doc, 'Ratings', summary.ratings);
      return;
    }

    this.renderKeyValueBlock(doc, 'Counts', summary.counts);
    this.renderKeyValueBlock(doc, 'Weights (kg)', summary.weights);
    this.renderKeyValueBlock(doc, 'Costs (IDR)', summary.costs);
    this.renderKeyValueBlock(doc, 'Ratings', summary.ratings);
  }

  private renderTopCategories(
    doc: PDFKit.PDFDocument,
    categories: PlatformImpactMetrics['top_categories'],
  ): void {
    doc.fontSize(18).text('Top Waste Categories');
    doc.moveDown(0.5);
    doc.fontSize(10);

    if (categories.length === 0) {
      doc.text('No category data available for the selected filters.');
      return;
    }

    doc.text('Category | Weight (kg) | Share (%)');
    doc.moveDown(0.25);

    for (const category of categories) {
      doc.text(
        `${category.category_name} | ${category.weight_kg} | ${category.percentage}%`,
      );
    }
  }

  private renderNotes(doc: PDFKit.PDFDocument): void {
    doc.fontSize(18).text('Notes & Limitations');
    doc.moveDown(0.5);
    doc.fontSize(10);

    const notes = [
      'This report aggregates PACUL marketplace data for the selected filters.',
      'WARNING: Payment and transaction values reflect SIMULATED payments only — no real payment gateway is connected.',
      'CO2 savings are estimated using a fixed multiplier (2.5 kg CO2 per kg recycled material) for hackathon MVP purposes.',
      'Download links expire after REPORT_EXPORT_EXPIRES_HOURS (see API documentation).',
      'For questions about data accuracy, cross-check with the in-app dashboard.',
    ];

    for (const note of notes) {
      doc.text(`• ${note}`, { lineGap: 4 });
    }
  }

  private renderKeyValueBlock(
    doc: PDFKit.PDFDocument,
    title: string,
    values: object,
  ): void {
    doc.fontSize(11).text(title, { underline: true });
    doc.fontSize(10);

    for (const [key, value] of Object.entries(values)) {
      doc.text(`${key}: ${String(value)}`);
    }

    doc.moveDown(0.5);
  }
}

function formatIdr(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}
