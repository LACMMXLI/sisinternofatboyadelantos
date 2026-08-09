import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { ListMovementsQueryDto } from './dto/list-movements.dto';
import { RejectMovementDto } from './dto/reject-movement.dto';
import { ReverseMovementDto } from './dto/reverse-movement.dto';
import { ReplaceMovementDto } from './dto/replace-movement.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCapability } from '../common/decorators/require-capability.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-request';

/**
 * Sin prefijo de módulo: expone tanto `/movements/*` (staff, alcance por
 * sucursal) como `/employees/:id/ledger/*` y `/employees/me/ledger*`
 * (autoservicio) en un solo controlador, siguiendo el mapa de endpoints del
 * prompt maestro §7. Las lecturas de alcance mixto (branch|all) se validan
 * dentro del servicio porque `CapabilityGuard` solo evalúa una capacidad por
 * ruta — ver `assertStaffReadCapability`.
 */
@ApiTags('ledger')
@Controller()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @RequireCapability('movement.create')
  @Post('movements')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMovementDto,
  ) {
    return this.ledgerService.create(user, dto);
  }

  @Get('movements')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMovementsQueryDto,
  ) {
    return this.ledgerService.list(user, query);
  }

  @RequireCapability('movement.approve')
  @Post('movements/:id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ledgerService.approve(user, id);
  }

  @RequireCapability('movement.approve')
  @Post('movements/:id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectMovementDto,
  ) {
    return this.ledgerService.reject(user, id, dto);
  }

  @RequireCapability('movement.reverse')
  @Post('movements/:id/reverse')
  reverse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReverseMovementDto,
  ) {
    return this.ledgerService.reverse(user, id, dto);
  }

  @RequireCapability('movement.replace')
  @Post('movements/:id/replace')
  replace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReplaceMovementDto,
  ) {
    return this.ledgerService.replace(user, id, dto);
  }

  // Las rutas literales `employees/me/...` deben registrarse ANTES que
  // `employees/:id/...` — si no, Nest matchea ":id" con el literal "me" y
  // el autoservicio nunca se alcanza (mismo número de segmentos de ruta).
  @RequireCapability('movement.read.own')
  @Get('employees/me/ledger')
  listForSelf(@CurrentUser() user: AuthenticatedUser) {
    return this.ledgerService.listForSelf(user);
  }

  @RequireCapability('movement.read.own')
  @Get('employees/me/ledger/summary')
  summaryForSelf(@CurrentUser() user: AuthenticatedUser) {
    return this.ledgerService.summaryForSelf(user);
  }

  @Get('employees/:id/ledger/summary')
  summaryForEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ledgerService.summaryForEmployee(user, id);
  }
}
