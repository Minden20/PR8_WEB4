import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { MenuCategoriesService } from './menu-categories.service.js';
import { MenuCategoryEntity } from './entities/menu-category.entity.js';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto.js';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto.js';

@Controller('menu-categories')
export class MenuCategoriesController {
  constructor(private readonly categoriesService: MenuCategoriesService) {}

  @Get()
  findAll(): Promise<MenuCategoryEntity[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MenuCategoryEntity> {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMenuCategoryDto): Promise<MenuCategoryEntity> {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuCategoryDto,
  ): Promise<MenuCategoryEntity> {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
