import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { MovementCategoryFieldsDto } from './create-movement-category.dto';

/**
 * `direction` deliberadamente ausente: es inmutable después de creada (§6).
 * No se acepta ni se ignora en silencio — simplemente no existe el campo,
 * así que enviarlo dispara `forbidNonWhitelisted` (400 explícito).
 */
export class UpdateMovementCategoryDto extends PartialType(
  MovementCategoryFieldsDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
