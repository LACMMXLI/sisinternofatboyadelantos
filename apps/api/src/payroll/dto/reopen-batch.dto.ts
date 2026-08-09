import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ReopenBatchDto {
  @ApiProperty()
  @IsString()
  @Length(1, 300)
  reason!: string;
}
