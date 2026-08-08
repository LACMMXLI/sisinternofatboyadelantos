import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PayrollPeriodFrequency } from '@prisma/client';

export class UpdateOrganizationSettingsDto {
  @ApiPropertyOptional({
    minimum: 0,
    maximum: 6,
    description: '0=domingo … 6=sábado',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekStartsOn?: number;

  @ApiPropertyOptional({ enum: PayrollPeriodFrequency })
  @IsOptional()
  payrollFrequency?: PayrollPeriodFrequency;

  @ApiPropertyOptional({ minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  payrollCutoffDay?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  correctionWindowMinutes?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  approvalThresholdCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acknowledgementRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  offlineEnabled?: boolean;
}
