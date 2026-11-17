import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAllergenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  readonly name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;
}
