import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

/**
 * Corrección de un movimiento POSTED (§6): reversa enlazada del original +
 * alta del reemplazo, en una sola transacción. La sucursal y el empleado se
 * heredan del movimiento original — no se pueden mover a otro empleado con
 * un "reemplazo" (eso sería otro movimiento nuevo, no una corrección).
 */
export class ReplaceMovementDto {
  @ApiProperty({ description: 'Motivo de la corrección.' })
  @IsString()
  @Length(1, 300)
  reason!: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ description: 'Centavos, siempre positivo.' })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  concept!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;

  @ApiProperty({
    description:
      'UUID generado por el cliente para el movimiento de reemplazo.',
  })
  @IsString()
  @Length(8, 100)
  idempotencyKey!: string;
}
