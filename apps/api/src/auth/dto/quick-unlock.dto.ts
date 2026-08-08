import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class QuickUnlockDto {
  @ApiProperty({
    example: '1234',
    description: 'PIN numérico del dispositivo autorizado.',
  })
  @IsString()
  @Length(4, 8)
  pin!: string;
}
