import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ReverseMovementDto {
  @ApiProperty()
  @IsString()
  @Length(1, 300)
  reason!: string;
}
