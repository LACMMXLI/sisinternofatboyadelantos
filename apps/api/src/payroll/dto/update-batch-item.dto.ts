import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateBatchItemDto {
  @ApiProperty({
    description: 'Centavos a aplicar para este empleado en el lote.',
  })
  @IsInt()
  @Min(0)
  plannedAmountCents!: number;
}
