import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishesController } from './dishes.controller.js';
import { DishesService } from './dishes.service.js';
import { DishEntity } from './entities/dish.entity.js';
import { MenuCategoryEntity } from '../menu-categories/entities/menu-category.entity.js';
import { AllergenEntity } from '../allergens/entities/allergen.entity.js';
import { SharedModule } from '../shared/shared.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DishEntity, MenuCategoryEntity, AllergenEntity]),
    SharedModule,
  ],
  controllers: [DishesController],
  providers: [DishesService],
  exports: [DishesService],
})
export class DishesModule {}
