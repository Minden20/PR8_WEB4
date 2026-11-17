import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID('4')
  readonly productId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  readonly quantity: number;
}
