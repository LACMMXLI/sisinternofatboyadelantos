import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  PAYROLL_BATCH_STATUSES,
  type PayrollBatchStatus,
} from '@libreta/shared';

export class ListBatchesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: PAYROLL_BATCH_STATUSES })
  @IsOptional()
  @IsIn(PAYROLL_BATCH_STATUSES)
  status?: PayrollBatchStatus;
}
