import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { DishesService } from '../dishes/dishes.service.js';
import { STORE_CONFIG } from '../shared/config/app-config.provider.js';
import { FEE_CALCULATOR } from '../shared/config/fee-calculator.provider.js';

const DISH_ID = '11111111-1111-4111-8111-111111111111';

describe('OrdersService', () => {
  let service: OrdersService;
  const dishesService = {
    findOne: vi.fn(async (id: string) => {
      if (id !== DISH_ID) throw new NotFoundException();
      return { id, title: 'Український борщ', price: 195 };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DishesService, useValue: dishesService },
        {
          provide: STORE_CONFIG,
          useValue: {
            storeName: 'Test',
            defaultCurrency: 'UAH',
            taxPercent: 10,
          },
        },
        {
          provide: FEE_CALCULATOR,
          useValue: { calculateTax: (a: number) => (a * 10) / 100 },
        },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  it('створює замовлення з податком', async () => {
    const order = await service.createOrder({
      productId: DISH_ID,
      quantity: 2,
    });
    expect(order.subtotal).toBe(390);
    expect(order.tax).toBe(39);
    expect(order.totalAmount).toBe(429);
    expect(service.findOne(order.id)).toEqual(order);
  });

  it('NotFoundException для неіснуючої страви', async () => {
    await expect(
      service.createOrder({ productId: 'nope', quantity: 1 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('BadRequestException для некоректної кількості', async () => {
    await expect(
      service.createOrder({ productId: DISH_ID, quantity: 0 }),
    ).rejects.toThrow(BadRequestException);
  });
});
