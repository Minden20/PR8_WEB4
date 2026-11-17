import { Test, TestingModule } from '@nestjs/testing';
import { DishesController } from './dishes.controller.js';
import { DishesService } from './dishes.service.js';

describe('DishesController', () => {
  let controller: DishesController;
  const service = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    restore: vi.fn(),
    findDeleted: vi.fn(),
    findBySlug: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DishesController],
      providers: [{ provide: DishesService, useValue: service }],
    }).compile();
    controller = module.get(DishesController);
  });

  it('findAll передає query в сервіс', async () => {
    const page = {
      data: [],
      meta: { page: 1, limit: 5, total: 0, totalPages: 0 },
    };
    service.findAll.mockResolvedValue(page);
    const query = { page: 1, limit: 5, sortBy: 'price', order: 'ASC' } as const;
    await expect(controller.findAll(query)).resolves.toEqual(page);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('remove делегує сервісу', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('id');
    expect(service.remove).toHaveBeenCalledWith('id');
  });

  it('restore делегує сервісу', async () => {
    service.restore.mockResolvedValue({ id: 'id' });
    await expect(controller.restore('id')).resolves.toEqual({ id: 'id' });
  });
});
