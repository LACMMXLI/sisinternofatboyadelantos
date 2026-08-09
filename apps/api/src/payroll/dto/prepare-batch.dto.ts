import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class PrepareBatchDto {
  @ApiProperty()
  @IsUUID()
  periodId!: string;

  @ApiPropertyOptional({
    description:
      'Si se omite, el lote incluye empleados de todas las sucursales accesibles.',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
