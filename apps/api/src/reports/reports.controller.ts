import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ListReportMovementsQueryDto } from './dto/list-report-movements.dto';
import { ListReportBalancesQueryDto } from './dto/list-report-balances.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCapability } from '../common/decorators/require-capability.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-request';

@ApiTags('reports')
@RequireCapability('report.read')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('movements')
  listMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReportMovementsQueryDto,
  ) {
    return this.reportsService.listMovements(user, query);
  }

  @Get('movements/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="movimientos.csv"')
  async exportMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReportMovementsQueryDto,
  ) {
    const csv = await this.reportsService.exportMovementsCsv(user, query);
    return new StreamableFile(csv);
  }

  @Get('balances')
  balances(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReportBalancesQueryDto,
  ) {
    return this.reportsService.balances(user, query);
  }
}
