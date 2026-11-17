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
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
} from 'class-validator';

export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  readonly title: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(999999.99)
  readonly price: number;

  @IsInt()
  @Min(10)
  readonly weightGrams: number;

  @IsInt()
  @Min(0)
  readonly calories: number;

  @IsBoolean()
  readonly isSpicy: boolean;

  @IsOptional()
  @IsUUID('4')
  readonly menuCategoryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(14)
  @ArrayUnique((name: unknown) => String(name).toLowerCase())
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(60, { each: true })
  readonly allergens?: string[];
}
