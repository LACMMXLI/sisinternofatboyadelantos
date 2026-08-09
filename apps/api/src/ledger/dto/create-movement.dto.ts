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

export class CreateMovementDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ description: 'Sucursal donde se registra el movimiento.' })
  @IsUUID()
  branchId!: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ description: 'Centavos, siempre positivo.' })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiProperty({ example: 'Adelanto de fin de semana' })
  @IsString()
  @Length(1, 200)
  concept!: string;

  @ApiPropertyOptional({
    description: 'Nota. Requerida si la categoría exige nota (requiresNote).',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;

  @ApiPropertyOptional({
    description:
      'Fecha del movimiento. Por defecto ahora; una fecha pasada requiere movement.backdate.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;

  @ApiProperty({
    description:
      'UUID generado por el cliente. Repetir la misma llave devuelve el mismo movimiento sin duplicar el efecto (§6).',
  })
  @IsString()
  @Length(8, 100)
  idempotencyKey!: string;
}
