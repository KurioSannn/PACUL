import { IsIn, IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ExcelExportRequestType } from '../reports.types';

export class ExportExcelDto {
  @ApiProperty({
    enum: ['transactions', 'materials', 'routes'],
    description: 'Excel report type to generate',
  })
  @IsIn(['transactions', 'materials', 'routes'])
  type!: ExcelExportRequestType;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  from_date?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  to_date?: string;
}
