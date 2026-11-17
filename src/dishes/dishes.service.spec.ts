import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DishesService } from './dishes.service.js';
import { DishEntity } from './entities/dish.entity.js';
import { MenuCategoryEntity } from '../menu-categories/entities/menu-category.entity.js';
import { AllergenEntity } from '../allergens/entities/allergen.entity.js';
import { SlugService } from '../shared/slug/slug.service.js';

const DISH_ID = '11111111-1111-4111-8111-111111111111';
const CATEGORY_ID = '22222222-2222-4222-8222-222222222222';

const makeDish = (over: Partial<DishEntity> = {}): DishEntity =>
  Object.assign(new DishEntity(), {
    id: DISH_ID,
    title: 'Український борщ',
    slug: 'ukrayinskyi-borshch',
    price: 195,
    weightGrams: 400,
    calories: 380,
    isSpicy: false,
    menuCategory: null,
    allergens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over,
  });

const makeQueryBuilder = (result: unknown) => {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of [
    'leftJoinAndSelect',
    'innerJoinAndSelect',
    'innerJoin',
    'select',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
  ]) {
    qb[method] = vi.fn(() => qb);
  }
  qb.getQuery = vi.fn(() => 'SELECT "matched"."id" FROM "dishes" "matched"');
  qb.getManyAndCount = vi.fn(async () => result);
  qb.getMany = vi.fn(async () => result);
  return qb;
};

describe('DishesService', () => {
  let service: DishesService;
  const dishRepo = {
    create: vi.fn((dto) => Object.assign(new DishEntity(), dto)),
    save: vi.fn(async (e) => ({ ...makeDish(), ...e })),
    merge: vi.fn((target, src) => Object.assign(target, src)),
    findOne: vi.fn(),
    find: vi.fn(),
    count: vi.fn(),
    exists: vi.fn(async () => false),
    softDelete: vi.fn(),
    restore: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
  const categoryRepo = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const allergenRepo = {
    create: vi.fn((dto) => Object.assign(new AllergenEntity(), dto)),
    createQueryBuilder: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DishesService,
        SlugService,
        { provide: getRepositoryToken(DishEntity), useValue: dishRepo },
        {
          provide: getRepositoryToken(MenuCategoryEntity),
          useValue: categoryRepo,
        },
        { provide: getRepositoryToken(AllergenEntity), useValue: allergenRepo },
      ],
    }).compile();
    service = module.get(DishesService);
  });

  it('create: прив’язує розділ меню та створює нові алергени через cascade', async () => {
    const category = Object.assign(new MenuCategoryEntity(), {
      id: CATEGORY_ID,
      name: 'Салати',
    });
    const milk = Object.assign(new AllergenEntity(), {
      id: 'a1',
      name: 'Молоко',
    });
    categoryRepo.findOneBy.mockResolvedValue(category);
    allergenRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([milk]));
    dishRepo.findOne.mockImplementation(async () => makeDish());

    await service.create({
      title: 'Салат Цезар з куркою',
      price: 210,
      weightGrams: 280,
      calories: 450,
      isSpicy: false,
      menuCategoryId: CATEGORY_ID,
      allergens: ['молоко', 'Яйця'],
    });

    const created = dishRepo.create.mock.calls[0][0];
    expect(created.slug).toBe('salat-tsezar-z-kurkoyu');
    expect(created.menuCategory).toBe(category);
    expect(created.allergens[0]).toBe(milk);
    expect(created.allergens[1]).toMatchObject({ name: 'Яйця' });
    expect(created.allergens[1].id).toBeUndefined();
    expect(dishRepo.save).toHaveBeenCalled();
  });

  it('create: NotFoundException для неіснуючого розділу меню', async () => {
    categoryRepo.findOneBy.mockResolvedValue(null);
    await expect(
      service.create({
        title: 'Страва',
        price: 100,
        weightGrams: 100,
        calories: 100,
        isSpicy: false,
        menuCategoryId: CATEGORY_ID,
      }),
    ).rejects.toThrow(NotFoundException);
    expect(dishRepo.save).not.toHaveBeenCalled();
  });

  it('findAll: фільтр за алергеном будується через innerJoinAndSelect і параметризований where', async () => {
    const qb = makeQueryBuilder([[makeDish()], 25]);
    dishRepo.createQueryBuilder.mockReturnValue(qb);

    const res = await service.findAll({
      page: 2,
      limit: 10,
      sortBy: 'price',
      order: 'ASC',
      allergen: 'Глютен',
    });

    expect(qb.innerJoinAndSelect).toHaveBeenCalledWith(
      'dish.allergens',
      'allergen',
    );
    expect(qb.where).toHaveBeenCalledWith(
      expect.stringContaining('dish.id IN'),
      { allergen: 'Глютен', allergenId: undefined },
    );
    expect(qb.orderBy).toHaveBeenCalledWith('dish.price', 'ASC');
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(res.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
  });

  it('findAll: без фільтра алергени підтягуються через leftJoinAndSelect', async () => {
    const qb = makeQueryBuilder([[], 0]);
    dishRepo.createQueryBuilder.mockReturnValue(qb);
    await service.findAll({});
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'dish.allergens',
      'allergen',
    );
    expect(qb.innerJoinAndSelect).not.toHaveBeenCalled();
  });

  it('findOne: завантажує зв’язки menuCategory та allergens', async () => {
    dishRepo.findOne.mockResolvedValue(makeDish());
    await service.findOne(DISH_ID);
    expect(dishRepo.findOne).toHaveBeenCalledWith({
      where: { id: DISH_ID },
      relations: { menuCategory: true, allergens: true },
    });
  });

  it('findOne: кидає NotFoundException, якщо null', async () => {
    dishRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('update: замінює набір алергенів', async () => {
    dishRepo.findOne.mockResolvedValue(makeDish());
    allergenRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));
    await service.update(DISH_ID, { allergens: ['Селера'] });
    const saved = dishRepo.save.mock.calls[0][0];
    expect(saved.allergens).toHaveLength(1);
    expect(saved.allergens[0]).toMatchObject({ name: 'Селера' });
  });

  it('remove: виконує softDelete', async () => {
    dishRepo.findOne.mockResolvedValue(makeDish());
    await service.remove(DISH_ID);
    expect(dishRepo.softDelete).toHaveBeenCalledWith(DISH_ID);
  });
});
