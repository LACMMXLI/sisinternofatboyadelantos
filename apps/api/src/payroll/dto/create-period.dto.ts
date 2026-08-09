import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn } from 'class-validator';
import {
  PAYROLL_PERIOD_FREQUENCIES,
  type PayrollPeriodFrequency,
} from '@libreta/shared';

export class CreatePeriodDto {
  @ApiProperty({ enum: PAYROLL_PERIOD_FREQUENCIES })
  @IsIn(PAYROLL_PERIOD_FREQUENCIES)
  frequency!: PayrollPeriodFrequency;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endsAt!: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  payDate!: Date;
}
