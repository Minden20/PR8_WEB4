import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategoryEntity } from './entities/menu-category.entity.js';
import { MenuCategoriesService } from './menu-categories.service.js';
import { MenuCategoriesController } from './menu-categories.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategoryEntity])],
  controllers: [MenuCategoriesController],
  providers: [MenuCategoriesService],
  exports: [MenuCategoriesService],
})
export class MenuCategoriesModule {}
