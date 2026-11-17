import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMenuCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly sortOrder?: number;
}
