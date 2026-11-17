import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

describe('OrdersController', () => {
  let controller: OrdersController;
  const service = {
    findAll: vi.fn(() => []),
    findOne: vi.fn(),
    createOrder: vi.fn(async (dto) => ({ id: 'o1', ...dto })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: service }],
    }).compile();
    controller = module.get(OrdersController);
  });

  it('findAll', () => {
    expect(controller.findAll()).toEqual([]);
  });

  it('createOrder', async () => {
    await expect(
      controller.createOrder({ productId: 'p', quantity: 1 }),
    ).resolves.toMatchObject({ id: 'o1', productId: 'p' });
  });
});
