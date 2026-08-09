import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PayrollPeriodsService } from './payroll-periods.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCapability } from '../common/decorators/require-capability.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-request';

@ApiTags('payroll-periods')
@Controller('payroll-periods')
export class PayrollPeriodsController {
  constructor(private readonly payrollPeriodsService: PayrollPeriodsService) {}

  @RequireCapability('payroll.prepare')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePeriodDto) {
    return this.payrollPeriodsService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollPeriodsService.list(user);
  }

  @RequireCapability('payroll.close')
  @Post(':id/close')
  close(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.payrollPeriodsService.close(user, id);
  }
}
