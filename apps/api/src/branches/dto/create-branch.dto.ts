import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'VEN' })
  @IsString()
  @Length(1, 20)
  code!: string;

  @ApiProperty({ example: 'Venecia' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 250)
  address?: string;
}
