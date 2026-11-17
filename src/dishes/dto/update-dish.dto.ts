import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
  Max,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateIf,
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
} from 'class-validator';

export class UpdateDishDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  readonly title?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(999999.99)
  readonly price?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  readonly weightGrams?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly calories?: number;

  @IsOptional()
  @IsBoolean()
  readonly isSpicy?: boolean;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUUID('4')
  readonly menuCategoryId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(14)
  @ArrayUnique((name: unknown) => String(name).toLowerCase())
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(60, { each: true })
  readonly allergens?: string[];
}
