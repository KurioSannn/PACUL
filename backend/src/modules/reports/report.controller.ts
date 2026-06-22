import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  THROTTLE_LIMITS,
  THROTTLE_TTL,
} from '../../common/config/throttle.config';
import type { AuthUser } from '../../common/types/auth-user';
import { ExportExcelDto } from './dto/export-excel.dto';
import { ExportPdfDto } from './dto/export-pdf.dto';
import { ReportService } from './report.service';

@ApiTags('reports')
@ApiBearerAuth('bearer')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  @Roles('household', 'collector', 'industry')
  @ApiOperation({ summary: 'List report export jobs for the current user' })
  listExports(@CurrentUser() user: AuthUser) {
    return this.reportService.listExports(user.id);
  }

  @Post('export/pdf')
  @Roles('household', 'collector', 'industry')
  @ApiOperation({ summary: 'Request a PDF impact report export' })
  @Throttle({
    default: {
      limit: THROTTLE_LIMITS.reportExportPerHour,
      ttl: THROTTLE_TTL.oneHourMs,
    },
  })
  exportPdf(@CurrentUser() user: AuthUser, @Body() dto: ExportPdfDto) {
    return this.reportService.requestPdfExport(user.id, user.role, {
      from_date: dto.from_date,
      to_date: dto.to_date,
      city: dto.city,
    });
  }

  @Post('export/excel')
  @Roles('household', 'collector', 'industry')
  @ApiOperation({ summary: 'Request an Excel report export' })
  @Throttle({
    default: {
      limit: THROTTLE_LIMITS.reportExportPerHour,
      ttl: THROTTLE_TTL.oneHourMs,
    },
  })
  exportExcel(@CurrentUser() user: AuthUser, @Body() dto: ExportExcelDto) {
    return this.reportService.requestExcelExport(user.id, user.role, dto.type, {
      from_date: dto.from_date,
      to_date: dto.to_date,
    });
  }

  @Get(':id/download')
  @Roles('household', 'collector', 'industry')
  @ApiOperation({ summary: 'Get a signed download URL for a completed export' })
  downloadExport(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reportService.getDownloadUrl(id, user.id);
  }

  @Get(':id')
  @Roles('household', 'collector', 'industry')
  @ApiOperation({ summary: 'Get export job status and metadata' })
  getExport(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reportService.getExport(id, user.id);
  }
}
