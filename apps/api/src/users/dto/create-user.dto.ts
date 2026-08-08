import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ROLES, type Role } from '@libreta/shared';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'jperez' })
  @IsString()
  @Length(3, 40)
  username!: string;

  @ApiPropertyOptional({ example: 'jperez@correo.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @Length(2, 120)
  displayName!: string;

  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: Role;

  @ApiPropertyOptional({
    type: [String],
    description:
      'IDs de sucursal permitidas. Ignorado para OWNER_ADMIN (alcance total).',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  branchIds?: string[];
}
