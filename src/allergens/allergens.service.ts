import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AllergenEntity } from './entities/allergen.entity.js';
import { CreateAllergenDto } from './dto/create-allergen.dto.js';

@Injectable()
export class AllergensService {
  constructor(
    @InjectRepository(AllergenEntity)
    private readonly allergenRepo: Repository<AllergenEntity>,
  ) {}

  findAll(): Promise<AllergenEntity[]> {
    return this.allergenRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<AllergenEntity> {
    const allergen = await this.allergenRepo.findOne({
      where: { id },
      relations: { dishes: true },
    });
    if (!allergen) {
      throw new NotFoundException(`Алерген з ID ${id} не знайдено`);
    }
    return allergen;
  }

  async create(dto: CreateAllergenDto): Promise<AllergenEntity> {
    if (await this.allergenRepo.existsBy({ name: dto.name })) {
      throw new ConflictException(`Алерген "${dto.name}" вже існує`);
    }
    return this.allergenRepo.save(this.allergenRepo.create(dto));
  }

  async remove(id: string): Promise<void> {
    const result = await this.allergenRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Алерген з ID ${id} не знайдено`);
    }
  }
}
