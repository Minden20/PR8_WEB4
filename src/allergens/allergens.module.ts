import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllergenEntity } from './entities/allergen.entity.js';
import { AllergensService } from './allergens.service.js';
import { AllergensController } from './allergens.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([AllergenEntity])],
  controllers: [AllergensController],
  providers: [AllergensService],
  exports: [AllergensService],
})
export class AllergensModule {}
