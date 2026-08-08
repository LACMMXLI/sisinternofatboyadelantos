import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jperez', description: 'Usuario o correo.' })
  @IsString()
  @MinLength(1)
  usernameOrEmail!: string;

  @ApiProperty({ example: 'ContraseñaTemporal123' })
  @IsString()
  @MinLength(1)
  password!: string;
}
