import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const DISH_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'price',
  'weightGrams',
  'calories',
] as const;
export type DishSortField = (typeof DISH_SORT_FIELDS)[number];

export class QueryDishesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsIn(DISH_SORT_FIELDS)
  sortBy: DishSortField = 'createdAt';

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === '1'
      ? true
      : value === 'false' || value === '0'
        ? false
        : value,
  )
  @IsBoolean()
  isSpicy?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsUUID('4')
  menuCategoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  allergen?: string;

  @IsOptional()
  @IsUUID('4')
  allergenId?: string;
}
