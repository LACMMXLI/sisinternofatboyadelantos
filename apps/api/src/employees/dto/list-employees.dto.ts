import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class ListEmployeesQueryDto {
  @ApiPropertyOptional({
    description: 'Búsqueda por nombre, apellido o número de empleado.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({
    description:
      'Restringe a una sucursal (debe ser accesible para el usuario).',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description:
      'Filtra por estado activo/inactivo. Si se omite, incluye ambos.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  @IsBoolean()
  active?: boolean;
}
