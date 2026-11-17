import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { DishEntity } from './entities/dish.entity.js';
import { MenuCategoryEntity } from '../menu-categories/entities/menu-category.entity.js';
import { AllergenEntity } from '../allergens/entities/allergen.entity.js';
import { CreateDishDto } from './dto/create-dish.dto.js';
import { UpdateDishDto } from './dto/update-dish.dto.js';
import { QueryDishesDto } from './dto/query-dishes.dto.js';
import { SlugService } from '../shared/slug/slug.service.js';
import { Paginated } from '../common/interfaces/paginated.interface.js';

const SEED_CATEGORIES = [
  { name: 'Супи', description: 'Перші страви', sortOrder: 1 },
  { name: 'Піца', description: 'Піца на тонкому тісті', sortOrder: 2 },
  { name: 'Салати', description: 'Свіжі салати', sortOrder: 3 },
  { name: 'Десерти', description: 'Солодке до кави', sortOrder: 4 },
];

const SEED_DISHES = [
  {
    title: 'Український борщ із пампушками',
    price: 195,
    weightGrams: 400,
    calories: 380,
    isSpicy: false,
    category: 'Супи',
    allergens: ['Глютен', 'Селера'],
  },
  {
    title: 'Піца Діавола з перцем халапеньйо',
    price: 290,
    weightGrams: 480,
    calories: 820,
    isSpicy: true,
    category: 'Піца',
    allergens: ['Глютен', 'Молоко'],
  },
  {
    title: 'Том Ям з королівськими креветками',
    price: 340.5,
    weightGrams: 360,
    calories: 310,
    isSpicy: true,
    category: 'Супи',
    allergens: ['Ракоподібні', 'Риба'],
  },
];

@Injectable()
export class DishesService implements OnModuleInit {
  private readonly logger = new Logger(DishesService.name);

  constructor(
    @InjectRepository(DishEntity)
    private readonly dishRepo: Repository<DishEntity>,
    @InjectRepository(MenuCategoryEntity)
    private readonly categoryRepo: Repository<MenuCategoryEntity>,
    @InjectRepository(AllergenEntity)
    private readonly allergenRepo: Repository<AllergenEntity>,
    private readonly slugService: SlugService,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.dishRepo.count({ withDeleted: true });
    if (count > 0) {
      this.logger.log(`У базі вже є ${count} страв(и), сидування пропущено.`);
      return;
    }
    const categories = await this.categoryRepo.save(
      SEED_CATEGORIES.map((c) => this.categoryRepo.create(c)),
    );
    for (const { category, ...dish } of SEED_DISHES) {
      const menuCategoryId = categories.find((c) => c.name === category)?.id;
      await this.create({ ...dish, menuCategoryId });
    }
    this.logger.log(
      `Додано ${categories.length} розділи меню та ${SEED_DISHES.length} страви.`,
    );
  }

  async create(dto: CreateDishDto): Promise<DishEntity> {
    const { menuCategoryId, allergens, ...data } = dto;
    const dish = this.dishRepo.create({
      ...data,
      slug: await this.generateUniqueSlug(dto.title),
      menuCategory: menuCategoryId
        ? await this.findCategory(menuCategoryId)
        : null,
      allergens: await this.resolveAllergens(allergens ?? []),
    });
    const saved = await this.dishRepo.save(dish);
    return this.findOne(saved.id);
  }

  async findAll(
    query: Partial<QueryDishesDto> = {},
  ): Promise<Paginated<DishEntity>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const qb = this.dishRepo
      .createQueryBuilder('dish')
      .leftJoinAndSelect('dish.menuCategory', 'menuCategory');

    if (query.allergen || query.allergenId) {
      const matched = this.dishRepo
        .createQueryBuilder('matched')
        .select('matched.id')
        .innerJoin('matched.allergens', 'matchedAllergen');
      if (query.allergen) {
        matched.andWhere('LOWER(matchedAllergen.name) = LOWER(:allergen)');
      }
      if (query.allergenId) {
        matched.andWhere('matchedAllergen.id = :allergenId');
      }
      qb.innerJoinAndSelect('dish.allergens', 'allergen').where(
        `dish.id IN (${matched.getQuery()})`,
        { allergen: query.allergen, allergenId: query.allergenId },
      );
    } else {
      qb.leftJoinAndSelect('dish.allergens', 'allergen');
    }

    if (query.search) {
      qb.andWhere('dish.title ILIKE :search', { search: `%${query.search}%` });
    }
    if (query.isSpicy !== undefined) {
      qb.andWhere('dish.isSpicy = :isSpicy', { isSpicy: query.isSpicy });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('dish.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    if (query.menuCategoryId) {
      qb.andWhere('menuCategory.id = :menuCategoryId', {
        menuCategoryId: query.menuCategoryId,
      });
    }

    const [data, total] = await qb
      .orderBy(`dish.${sortBy}`, order)
      .addOrderBy('dish.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    data.forEach((dish) => this.sortAllergens(dish));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  findDeleted(): Promise<DishEntity[]> {
    return this.dishRepo.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
      order: { deletedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DishEntity> {
    const dish = await this.dishRepo.findOne({
      where: { id },
      relations: { menuCategory: true, allergens: true },
    });
    if (!dish) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    return this.sortAllergens(dish);
  }

  async findBySlug(slug: string): Promise<DishEntity> {
    const dish = await this.dishRepo.findOne({
      where: { slug: slug.toLowerCase().trim() },
      relations: { menuCategory: true, allergens: true },
    });
    if (!dish) {
      throw new NotFoundException(`Страву зі slug "${slug}" не знайдено`);
    }
    return this.sortAllergens(dish);
  }

  async update(id: string, dto: UpdateDishDto): Promise<DishEntity> {
    const dish = await this.findOne(id);
    const { menuCategoryId, allergens, ...data } = dto;
    if (data.title !== undefined && data.title !== dish.title) {
      dish.slug = await this.generateUniqueSlug(data.title);
    }
    if (menuCategoryId !== undefined) {
      dish.menuCategory = menuCategoryId
        ? await this.findCategory(menuCategoryId)
        : null;
    }
    if (allergens !== undefined) {
      dish.allergens = await this.resolveAllergens(allergens);
    }
    this.dishRepo.merge(dish, data);
    await this.dishRepo.save(dish);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.dishRepo.softDelete(id);
  }

  async restore(id: string): Promise<DishEntity> {
    const dish = await this.dishRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!dish) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    if (dish.deletedAt) {
      await this.dishRepo.restore(id);
    }
    return this.findOne(id);
  }

  private sortAllergens(dish: DishEntity): DishEntity {
    dish.allergens?.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    return dish;
  }

  private async resolveAllergens(names: string[]): Promise<AllergenEntity[]> {
    const unique = [
      ...new Map(
        names.map((name) => [name.trim().toLowerCase(), name.trim()]),
      ).values(),
    ];
    if (unique.length === 0) {
      return [];
    }
    const existing = await this.allergenRepo
      .createQueryBuilder('allergen')
      .where('LOWER(allergen.name) IN (:...names)', {
        names: unique.map((name) => name.toLowerCase()),
      })
      .getMany();
    return unique.map(
      (name) =>
        existing.find((a) => a.name.toLowerCase() === name.toLowerCase()) ??
        this.allergenRepo.create({ name }),
    );
  }

  private async findCategory(id: string): Promise<MenuCategoryEntity> {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Розділ меню з ID ${id} не знайдено`);
    }
    return category;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = this.slugService.generateSlug(title);
    const taken = await this.dishRepo.exists({
      where: { slug: base },
      withDeleted: true,
    });
    return taken ? `${base}-${randomBytes(3).toString('hex')}` : base;
  }
}
