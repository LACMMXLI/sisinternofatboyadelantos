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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCapability } from '../common/decorators/require-capability.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-request';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @RequireCapability('employee.read')
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListEmployeesQueryDto,
  ) {
    return this.employeesService.list(user, query);
  }

  @RequireCapability('employee.read')
  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.employeesService.get(user, id);
  }

  @RequireCapability('employee.manage')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(user.organizationId, dto);
  }

  @RequireCapability('employee.manage')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(user.organizationId, id, dto);
  }

  @RequireCapability('employee.manage')
  @Post(':id/deactivate')
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.employeesService.setActive(user.organizationId, id, false);
  }

  @RequireCapability('employee.manage')
  @Post(':id/reactivate')
  reactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.employeesService.setActive(user.organizationId, id, true);
  }
}
