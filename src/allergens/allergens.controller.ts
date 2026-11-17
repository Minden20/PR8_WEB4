import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AllergensService } from './allergens.service.js';
import { AllergenEntity } from './entities/allergen.entity.js';
import { CreateAllergenDto } from './dto/create-allergen.dto.js';

@Controller('allergens')
export class AllergensController {
  constructor(private readonly allergensService: AllergensService) {}

  @Get()
  findAll(): Promise<AllergenEntity[]> {
    return this.allergensService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AllergenEntity> {
    return this.allergensService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAllergenDto): Promise<AllergenEntity> {
    return this.allergensService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.allergensService.remove(id);
  }
}
