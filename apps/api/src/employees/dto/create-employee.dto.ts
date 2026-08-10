import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-0042' })
  @IsString()
  @Length(1, 30)
  employeeNumber!: string;

  @ApiProperty({ example: 'Renata' })
  @IsString()
  @Length(1, 80)
  firstName!: string;

  @ApiProperty({ example: 'Cifuentes' })
  @IsString()
  @Length(1, 80)
  lastName!: string;

  @ApiPropertyOptional({
    description:
      'Nombre para mostrar. Si se omite, se calcula como "firstName lastName".',
  })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Operaria' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hireDate?: Date;

  @ApiPropertyOptional({
    description:
      'Sueldo bruto por periodo de nómina (según la frecuencia semanal/quincenal del negocio), en centavos. Opcional: no calcula ISR/IMSS, solo sirve para estimar el neto y advertir sobregiros de adelantos.',
    example: 250000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  baseSalaryCents?: number;

  @ApiProperty({ description: 'Sucursal principal del empleado.' })
  @IsUUID()
  primaryBranchId!: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Sucursales adicionales donde el empleado también puede registrar movimientos.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  additionalBranchIds?: string[];
}
