import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MovementCategoriesService } from './movement-categories.service';
import { CreateMovementCategoryDto } from './dto/create-movement-category.dto';
import { UpdateMovementCategoryDto } from './dto/update-movement-category.dto';
import { ListMovementCategoriesQueryDto } from './dto/list-movement-categories.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCapability } from '../common/decorators/require-capability.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-request';

@ApiTags('movement-categories')
@Controller('movement-categories')
export class MovementCategoriesController {
  constructor(
    private readonly movementCategoriesService: MovementCategoriesService,
  ) {}

  // Sin @RequireCapability: cualquier usuario autenticado de la organización
  // necesita leer el catálogo para registrar movimientos (§7), igual que
  // /branches. La gestión (crear/editar/(des)activar) sí exige capacidad.
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMovementCategoriesQueryDto,
  ) {
    return this.movementCategoriesService.list(user.organizationId, query);
  }

  @RequireCapability('category.manage')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMovementCategoryDto,
  ) {
    return this.movementCategoriesService.create(user.organizationId, dto);
  }

  @RequireCapability('category.manage')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMovementCategoryDto,
  ) {
    return this.movementCategoriesService.update(user.organizationId, id, dto);
  }

  @RequireCapability('category.manage')
  @Post(':id/deactivate')
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.movementCategoriesService.setActive(
      user.organizationId,
      id,
      false,
    );
  }

  @RequireCapability('category.manage')
  @Post(':id/reactivate')
  reactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.movementCategoriesService.setActive(
      user.organizationId,
      id,
      true,
    );
  }
}
