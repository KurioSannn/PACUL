import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../common/config/env.validation';
import { StorageService } from '../storage/storage.service';
import type { TraceabilityEntityType } from '../traceability/traceability.types';
import { TraceabilityService } from '../traceability/traceability.service';
import type { UserRole } from '../profiles/profiles.types';
import { SupabaseService } from '../../supabase/supabase.service';
import { ExcelGenerator } from './excel-generator';
import { PdfGenerator } from './pdf-generator';
import type {
  ExcelExportRequestType,
  ReportDownloadResponse,
  ReportExportFilters,
  ReportExportRecord,
  ReportExportSummary,
  ReportExportType,
} from './reports.types';
import {
  LIST_EXPORTS_LIMIT,
  SIGNED_DOWNLOAD_URL_EXPIRES_SEC,
} from './reports.types';

interface ReportExportRow {
  id: string;
  user_id: string;
  export_type: string;
  status: string;
  file_path: string | null;
  file_size_bytes: number | null;
  filters: ReportExportFilters | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

const REPORT_EXPORT_SELECT = `
  id,
  user_id,
  export_type,
  status,
  file_path,
  file_size_bytes,
  filters,
  error_message,
  created_at,
  completed_at,
  expires_at
`;

@Injectable()
export class ReportService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly storageService: StorageService,
    private readonly pdfGenerator: PdfGenerator,
    private readonly excelGenerator: ExcelGenerator,
    private readonly traceabilityService: TraceabilityService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async requestPdfExport(
    userId: string,
    role: UserRole,
    filters: ReportExportFilters,
  ): Promise<ReportExportSummary> {
    const exportRecord = await this.createPendingExport(
      userId,
      'pdf_impact',
      filters,
    );

    try {
      const buffer = await this.pdfGenerator.generateImpactReport(
        userId,
        role,
        filters,
      );
      const fileName = `impact-report-${exportRecord.id}.pdf`;

      return await this.completeExport(exportRecord, buffer, fileName, {
        userId,
        role,
        exportType: 'pdf_impact',
      });
    } catch (error) {
      await this.markExportFailed(exportRecord.id, error);
      throw error;
    }
  }

  async requestExcelExport(
    userId: string,
    role: UserRole,
    exportType: ExcelExportRequestType,
    filters: ReportExportFilters,
  ): Promise<ReportExportSummary> {
    this.assertExcelExportAllowed(role, exportType);

    const dbExportType = this.mapExcelTypeToDbType(exportType);
    const exportRecord = await this.createPendingExport(
      userId,
      dbExportType,
      filters,
    );

    try {
      const buffer = await this.generateExcelBuffer(
        exportType,
        userId,
        role,
        filters,
      );
      const fileName = `${exportType}-report-${exportRecord.id}.xlsx`;

      return await this.completeExport(exportRecord, buffer, fileName, {
        userId,
        role,
        exportType: dbExportType,
      });
    } catch (error) {
      await this.markExportFailed(exportRecord.id, error);
      throw error;
    }
  }

  async getExport(
    exportId: string,
    userId: string,
  ): Promise<ReportExportSummary> {
    const record = await this.fetchOwnedExport(exportId, userId);
    return this.toSummary(record, true);
  }

  async getDownloadUrl(
    exportId: string,
    userId: string,
  ): Promise<ReportDownloadResponse> {
    const record = await this.fetchOwnedExport(exportId, userId);

    if (record.status !== 'completed') {
      throw new BadRequestException({
        error: 'Report export is not ready for download',
        code: 'EXPORT_NOT_READY',
      });
    }

    if (this.isExpired(record.expires_at)) {
      throw new GoneException({
        error: 'Report export download has expired',
        code: 'EXPORT_EXPIRED',
      });
    }

    if (!record.file_path) {
      throw new InternalServerErrorException({
        error: 'Completed export is missing a storage path',
        code: 'REPORT_FILE_PATH_MISSING',
      });
    }

    const signedUrl = await this.storageService.getSignedReportUrl(
      record.file_path,
      SIGNED_DOWNLOAD_URL_EXPIRES_SEC,
    );

    return {
      signedUrl,
      expiresAt: new Date(
        Date.now() + SIGNED_DOWNLOAD_URL_EXPIRES_SEC * 1000,
      ).toISOString(),
    };
  }

  async listExports(userId: string): Promise<ReportExportSummary[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('report_exports')
      .select(REPORT_EXPORT_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(LIST_EXPORTS_LIMIT);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to list report exports',
        code: 'REPORT_LIST_FAILED',
        details: error.message,
      });
    }

    return Promise.all(
      (data ?? []).map((row: ReportExportRow) =>
        this.toSummary(this.mapRow(row), false),
      ),
    );
  }

  private async generateExcelBuffer(
    exportType: ExcelExportRequestType,
    userId: string,
    role: UserRole,
    filters: ReportExportFilters,
  ): Promise<Buffer> {
    switch (exportType) {
      case 'transactions':
        return this.excelGenerator.generateTransactionReport(
          userId,
          role,
          filters,
        );
      case 'materials':
        return this.excelGenerator.generateMaterialReport(userId, filters);
      case 'routes':
        return this.excelGenerator.generateRouteReport(userId, filters);
    }
  }

  private assertExcelExportAllowed(
    role: UserRole,
    exportType: ExcelExportRequestType,
  ): void {
    if (exportType === 'routes' && role !== 'collector') {
      throw new ForbiddenException({
        error: 'Only collectors can export route reports',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    if (exportType === 'materials' && role !== 'collector') {
      throw new ForbiddenException({
        error: 'Only collectors can export material reports',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    if (exportType === 'transactions' && role === 'household') {
      throw new ForbiddenException({
        error: 'Household accounts cannot export transaction reports',
        code: 'INSUFFICIENT_ROLE',
      });
    }
  }

  private mapExcelTypeToDbType(
    exportType: ExcelExportRequestType,
  ): ReportExportType {
    switch (exportType) {
      case 'transactions':
        return 'excel_transactions';
      case 'materials':
        return 'excel_materials';
      case 'routes':
        return 'excel_routes';
    }
  }

  private async createPendingExport(
    userId: string,
    exportType: ReportExportType,
    filters: ReportExportFilters,
  ): Promise<ReportExportRecord> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('report_exports')
      .insert({
        user_id: userId,
        export_type: exportType,
        status: 'pending',
        filters,
      })
      .select(REPORT_EXPORT_SELECT)
      .single<ReportExportRow>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create report export record',
        code: 'REPORT_CREATE_FAILED',
        details: error?.message ?? 'Insert returned no row',
      });
    }

    return this.mapRow(data);
  }

  private async completeExport(
    exportRecord: ReportExportRecord,
    buffer: Buffer,
    fileName: string,
    traceContext: {
      userId: string;
      role: UserRole;
      exportType: ReportExportType;
    },
  ): Promise<ReportExportSummary> {
    const upload = await this.storageService.uploadReport(
      buffer,
      fileName,
      exportRecord.id,
    );

    const completedAt = new Date();
    const expiresAt = new Date(
      completedAt.getTime() + this.getExportExpiresHours() * 60 * 60 * 1000,
    );

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('report_exports')
      .update({
        status: 'completed',
        file_path: upload.path,
        file_size_bytes: buffer.length,
        completed_at: completedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        error_message: null,
      })
      .eq('id', exportRecord.id)
      .select(REPORT_EXPORT_SELECT)
      .single<ReportExportRow>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to finalize report export record',
        code: 'REPORT_UPDATE_FAILED',
        details: error?.message ?? 'Update returned no row',
      });
    }

    this.traceabilityService.emitEvent({
      eventType: 'report_exported',
      entityType: 'report_export' as TraceabilityEntityType,
      entityId: exportRecord.id,
      actorId: traceContext.userId,
      actorRole: traceContext.role,
      metadata: {
        exportType: traceContext.exportType,
        fileSizeBytes: buffer.length,
      },
    });

    return this.toSummary(this.mapRow(data), true);
  }

  private async markExportFailed(
    exportId: string,
    error: unknown,
  ): Promise<void> {
    const message =
      error instanceof Error ? error.message : 'Unknown export failure';

    const admin = this.supabaseService.getAdminClient();
    await admin
      .from('report_exports')
      .update({
        status: 'failed',
        error_message: message.slice(0, 500),
      })
      .eq('id', exportId);
  }

  private async fetchOwnedExport(
    exportId: string,
    userId: string,
  ): Promise<ReportExportRecord> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('report_exports')
      .select(REPORT_EXPORT_SELECT)
      .eq('id', exportId)
      .maybeSingle<ReportExportRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load report export',
        code: 'REPORT_LOAD_FAILED',
        details: error.message,
      });
    }

    if (!data || data.user_id !== userId) {
      throw new NotFoundException({
        error: 'Report export not found',
        code: 'REPORT_NOT_FOUND',
      });
    }

    return this.mapRow(data);
  }

  private async toSummary(
    record: ReportExportRecord,
    includeDownloadUrl: boolean,
  ): Promise<ReportExportSummary> {
    const summary: ReportExportSummary = {
      id: record.id,
      export_type: record.export_type,
      status: record.status,
      created_at: record.created_at,
      completed_at: record.completed_at,
      expires_at: record.expires_at,
      file_size_bytes: record.file_size_bytes,
    };

    if (
      includeDownloadUrl &&
      record.status === 'completed' &&
      record.file_path &&
      !this.isExpired(record.expires_at)
    ) {
      summary.downloadUrl = await this.storageService.getSignedReportUrl(
        record.file_path,
        SIGNED_DOWNLOAD_URL_EXPIRES_SEC,
      );
    }

    return summary;
  }

  private mapRow(row: ReportExportRow): ReportExportRecord {
    return {
      id: row.id,
      user_id: row.user_id,
      export_type: row.export_type as ReportExportRecord['export_type'],
      status: row.status as ReportExportRecord['status'],
      file_path: row.file_path,
      file_size_bytes: row.file_size_bytes,
      filters: row.filters ?? {},
      error_message: row.error_message,
      created_at: row.created_at,
      completed_at: row.completed_at,
      expires_at: row.expires_at,
    };
  }

  private isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) {
      return false;
    }

    return new Date(expiresAt).getTime() <= Date.now();
  }

  private getExportExpiresHours(): number {
    return (
      this.configService.get('REPORT_EXPORT_EXPIRES_HOURS', { infer: true }) ??
      24
    );
  }
}
