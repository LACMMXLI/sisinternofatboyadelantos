import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MovementDirection } from '@libreta/shared';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

const MOVEMENT_DIRECTIONS: MovementDirection[] = ['CHARGE', 'CREDIT'];

/**
 * Campos editables de una categoría. La dirección se declara aparte
 * (`CreateMovementCategoryDto`) porque es inmutable una vez creada (§6,
 * "reglas del ledger" — no forma parte de `UpdateMovementCategoryDto`).
 */
export class MovementCategoryFieldsDto {
  @ApiProperty({ example: 'CASH_ADVANCE' })
  @IsString()
  @Length(1, 40)
  code!: string;

  @ApiProperty({ example: 'Adelanto' })
  @IsString()
  @Length(1, 80)
  label!: string;

  @ApiProperty({
    example: 'HandCoins',
    description: 'Nombre de icono lucide-react.',
  })
  @IsString()
  @Length(1, 60)
  iconName!: string;

  @ApiProperty({ example: 'danger' })
  @IsString()
  @Length(1, 40)
  colorToken!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresNote?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresEvidence?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: 'Centavos. Requiere aprobación por encima de este monto.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  approvalThresholdCents?: number;

  @ApiPropertyOptional({ description: 'Centavos.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  dailyLimitCents?: number;

  @ApiPropertyOptional({ description: 'Centavos.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyLimitCents?: number;

  @ApiPropertyOptional({ description: 'Centavos.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPerMovementCents?: number;
}

export class CreateMovementCategoryDto extends MovementCategoryFieldsDto {
  @ApiProperty({ enum: MOVEMENT_DIRECTIONS })
  @IsIn(MOVEMENT_DIRECTIONS)
  direction!: MovementDirection;
}
