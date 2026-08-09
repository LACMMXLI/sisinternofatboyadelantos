import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListMovementCategoriesQueryDto {
  @ApiPropertyOptional({
    description:
      'Si es true, incluye categorías inactivas (pantallas de administración). Por defecto solo activas.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  @IsBoolean()
  includeInactive?: boolean;
}
