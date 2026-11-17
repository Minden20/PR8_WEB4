import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategoryEntity } from './entities/menu-category.entity.js';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto.js';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto.js';

@Injectable()
export class MenuCategoriesService {
  constructor(
    @InjectRepository(MenuCategoryEntity)
    private readonly categoryRepo: Repository<MenuCategoryEntity>,
  ) {}

  findAll(): Promise<MenuCategoryEntity[]> {
    return this.categoryRepo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string): Promise<MenuCategoryEntity> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: { dishes: true },
      order: { dishes: { title: 'ASC' } },
    });
    if (!category) {
      throw new NotFoundException(`Розділ меню з ID ${id} не знайдено`);
    }
    return category;
  }

  async create(dto: CreateMenuCategoryDto): Promise<MenuCategoryEntity> {
    await this.ensureNameIsFree(dto.name);
    return this.categoryRepo.save(this.categoryRepo.create(dto));
  }

  async update(
    id: string,
    dto: UpdateMenuCategoryDto,
  ): Promise<MenuCategoryEntity> {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Розділ меню з ID ${id} не знайдено`);
    }
    if (dto.name !== undefined && dto.name !== category.name) {
      await this.ensureNameIsFree(dto.name);
    }
    this.categoryRepo.merge(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Розділ меню з ID ${id} не знайдено`);
    }
  }

  private async ensureNameIsFree(name: string): Promise<void> {
    if (await this.categoryRepo.existsBy({ name })) {
      throw new ConflictException(`Розділ меню "${name}" вже існує`);
    }
  }
}
