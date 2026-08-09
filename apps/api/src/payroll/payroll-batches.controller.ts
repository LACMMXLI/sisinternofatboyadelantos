import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PayrollBatchesService } from './payroll-batches.service';
import { PrepareBatchDto } from './dto/prepare-batch.dto';
import { ListBatchesQueryDto } from './dto/list-batches.dto';
import { UpdateBatchItemDto } from './dto/update-batch-item.dto';
import { ReopenBatchDto } from './dto/reopen-batch.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCapability } from '../common/decorators/require-capability.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-request';

@ApiTags('payroll-batches')
@Controller('payroll-batches')
export class PayrollBatchesController {
  constructor(private readonly payrollBatchesService: PayrollBatchesService) {}

  @RequireCapability('payroll.prepare')
  @Post()
  prepare(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PrepareBatchDto,
  ) {
    return this.payrollBatchesService.prepare(user, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListBatchesQueryDto,
  ) {
    return this.payrollBatchesService.list(user, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.payrollBatchesService.get(user, id);
  }

  @Get(':id/export/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="nomina.pdf"')
  async exportPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const pdf = await this.payrollBatchesService.exportPdf(user, id);
    return new StreamableFile(pdf);
  }

  @RequireCapability('payroll.prepare')
  @Patch(':id/items/:itemId')
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateBatchItemDto,
  ) {
    return this.payrollBatchesService.updateItem(user, id, itemId, dto);
  }

  @RequireCapability('payroll.prepare')
  @Post(':id/submit')
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.payrollBatchesService.submit(user, id);
  }

  @RequireCapability('payroll.prepare')
  @Post(':id/lock')
  lock(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.payrollBatchesService.lock(user, id);
  }

  @RequireCapability('payroll.apply')
  @Post(':id/apply')
  apply(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.payrollBatchesService.apply(user, id);
  }

  @RequireCapability('payroll.close')
  @Post(':id/close')
  close(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.payrollBatchesService.close(user, id);
  }

  @RequireCapability('payroll.reopen')
  @Post(':id/reopen')
  reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReopenBatchDto,
  ) {
    return this.payrollBatchesService.reopen(user, id, dto);
  }
}
