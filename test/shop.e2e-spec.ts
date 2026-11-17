import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Зв’язки Dish / MenuCategory / Allergen (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1:M, M:N з cascade та фільтрація через QueryBuilder', async () => {
    const server = app.getHttpServer();
    const suffix = Date.now();

    const category = await request(server)
      .post('/menu-categories')
      .send({ name: `E2E розділ ${suffix}` })
      .expect(201);

    const allergenName = `E2E-алерген-${suffix}`;
    const dish = await request(server)
      .post('/dishes')
      .send({
        title: `E2E страва ${suffix}`,
        price: 99.9,
        weightGrams: 100,
        calories: 50,
        isSpicy: true,
        menuCategoryId: category.body.id,
        allergens: [allergenName, 'Молоко'],
      })
      .expect(201);

    const found = await request(server)
      .get(`/dishes/${dish.body.id}`)
      .expect(200);
    expect(found.body.menuCategory.id).toBe(category.body.id);
    expect(found.body.allergens.map((a: { name: string }) => a.name)).toEqual(
      expect.arrayContaining([allergenName, 'Молоко']),
    );

    const filtered = await request(server)
      .get('/dishes')
      .query({ allergen: allergenName.toUpperCase() })
      .expect(200);
    expect(filtered.body.meta.total).toBe(1);
    expect(filtered.body.data[0].id).toBe(dish.body.id);
    expect(filtered.body.data[0].allergens).toHaveLength(2);

    await request(server).get('/dishes?allergenId=abc').expect(400);

    await request(server)
      .delete(`/menu-categories/${category.body.id}`)
      .expect(204);
    const orphan = await request(server)
      .get(`/dishes/${dish.body.id}`)
      .expect(200);
    expect(orphan.body.menuCategory).toBeNull();

    await request(server).delete(`/dishes/${dish.body.id}`).expect(204);
  });
});
