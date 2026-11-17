import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DishesService } from './dishes.service.js';
import { CreateDishDto } from './dto/create-dish.dto.js';
import { UpdateDishDto } from './dto/update-dish.dto.js';
import { QueryDishesDto } from './dto/query-dishes.dto.js';
import { DishEntity } from './entities/dish.entity.js';
import { Paginated } from '../common/interfaces/paginated.interface.js';

@Controller('dishes')
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get()
  findAll(@Query() query: QueryDishesDto): Promise<Paginated<DishEntity>> {
    return this.dishesService.findAll(query);
  }

  @Get('deleted')
  findDeleted(): Promise<DishEntity[]> {
    return this.dishesService.findDeleted();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string): Promise<DishEntity> {
    return this.dishesService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DishEntity> {
    return this.dishesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDishDto): Promise<DishEntity> {
    return this.dishesService.create(dto);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<DishEntity> {
    return this.dishesService.restore(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDishDto,
  ): Promise<DishEntity> {
    return this.dishesService.update(id, dto);
  }

  @Put(':id')
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDishDto,
  ): Promise<DishEntity> {
    return this.dishesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.dishesService.remove(id);
  }
}
