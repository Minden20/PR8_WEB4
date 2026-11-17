# Практична робота №8: зв'язки між сутностями та міграції TypeORM

## Варіант 4: Ресторан та доставка їжі

| Базова сутність | 1:M | M:N | 1:1 |
|---|---|---|---|
| `DishEntity` (страва) | `MenuCategoryEntity` (розділ меню) | `AllergenEntity` (алергени) | `NutritionalValueEntity`, рівень 3, не виконувався |

Проєкт продовжує ПР7. Автоматичну синхронізацію схеми (`synchronize: true`) вимкнено. Структура БД тепер змінюється лише міграціями TypeORM CLI. Додано зв'язки «розділ меню → страви» (1:M) і «страви ↔ алергени» (M:N), а також фільтрацію страв за алергеном через `createQueryBuilder`.

**Виконано:** рівень 1 і рівень 2.

---

## 1. Стек

| Компонент | Версія |
|---|---|
| NestJS | 12 |
| TypeORM / @nestjs/typeorm | 1.1 / 12.0 |
| PostgreSQL (Docker) | `postgres:16-alpine` |
| dotenv | 18 |
| Тести | Vitest + Supertest |

---

## 2. Рівень 1

### 2.1. Data Source і скрипти CLI

`src/database/database.options.ts` містить спільні параметри підключення. Їх використовують і застосунок, і CLI:

```ts
export const databaseOptions = {
  type: 'postgres' as const,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'food_user',
  password: process.env.DB_PASSWORD ?? 'food_password',
  database: process.env.DB_NAME ?? 'food_delivery',
  uuidExtension: 'pgcrypto' as const,
  synchronize: false,
};
```

`src/database/data-source.ts` — окремий `DataSource` для CLI:

```ts
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database.options.js';

export default new DataSource({
  ...databaseOptions,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
});
```

Скрипти в `package.json`:

```json
"typeorm": "typeorm -d dist/database/data-source.js",
"migration:generate": "nest build && npm run typeorm -- migration:generate",
"migration:run": "nest build && npm run typeorm -- migration:run",
"migration:revert": "nest build && npm run typeorm -- migration:revert",
"migration:show": "nest build && npm run typeorm -- migration:show"
```

> Проєкт працює як ES-модуль (`"type": "module"`, `moduleResolution: nodenext`). Тому `typeorm-ts-node-commonjs` з методички тут не підходить: він не завантажує ESM-файли з розширенням `.js` в імпортах. CLI працює зі скомпільованим `dist/database/data-source.js`, а кожна команда спочатку виконує `nest build`. Згенеровані `.ts`-міграції лежать у `src/database/migrations` і під час збірки потрапляють у `dist/database/migrations`.

> `uuidExtension: 'pgcrypto'` змушує TypeORM генерувати `DEFAULT gen_random_uuid()`. Ця функція вбудована в PostgreSQL 13+, тож розширення `uuid-ossp` не потрібне.

### 2.2. `synchronize: false`

```ts
TypeOrmModule.forRoot({
  ...databaseOptions,
  autoLoadEntities: true,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
}),
```

Параметри підключення читаються з `.env` (шаблон — `.env.example`). `main.ts` першим рядком імпортує `dotenv/config`.

### 2.3. Зв'язок 1:M / M:1 — `MenuCategoryEntity` → `DishEntity`

```ts
@Entity('menu_categories')
export class MenuCategoryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 100, unique: true }) name: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'integer', default: 0 }) sortOrder: number;

  @OneToMany(() => DishEntity, (dish) => dish.menuCategory)
  dishes: DishEntity[];
}
```

```ts
@ManyToOne(() => MenuCategoryEntity, (category) => category.dishes, {
  nullable: true,
  onDelete: 'SET NULL',
})
@JoinColumn({ name: 'menu_category_id' })
menuCategory: Relation<MenuCategoryEntity> | null;
```

`@JoinColumn` стоїть на боці `ManyToOne`, бо саме таблиця `dishes` зберігає зовнішній ключ `menu_category_id`. Для розділу меню обрано `onDelete: 'SET NULL'`: після видалення розділу страви не зникають, а лише втрачають прив'язку. Е2Е-тест перевіряє і це.

Enum-колонку `category` з ПР7 замінено на повноцінний довідник `menu_categories`.

### 2.4. Міграція `CreateRelations`

```bash
npm run migration:generate -- src/database/migrations/CreateRelations
npm run migration:run
```

Згенерований файл `src/database/migrations/1794767602041-CreateRelations.ts` створює таблиці `menu_categories`, `dishes` і зовнішній ключ:

```sql
ALTER TABLE "dishes" ADD CONSTRAINT "FK_4ad462e9..." FOREIGN KEY ("menu_category_id")
  REFERENCES "menu_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
```

### 2.5. Отримання зв'язаних даних

```ts
const dish = await this.dishRepo.findOne({
  where: { id },
  relations: { menuCategory: true, allergens: true },
});
```

> У TypeORM 1.x параметр `relations` приймає лише об'єкт. Запис масивом (`relations: ['menuCategory']`) не компілюється.

Маршрути розділів меню: `GET /menu-categories`, `GET /menu-categories/:id` (разом зі стравами), `POST`, `PATCH /:id`, `DELETE /:id`.

---

## 3. Рівень 2

### 3.1. Зв'язок M:N — `DishEntity` ↔ `AllergenEntity`

```ts
@ManyToMany(() => AllergenEntity, (allergen) => allergen.dishes, {
  cascade: true,
})
@JoinTable({
  name: 'dish_allergens',
  joinColumn: { name: 'dish_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'allergen_id', referencedColumnName: 'id' },
})
allergens: AllergenEntity[];
```

```ts
@Entity('allergens')
export class AllergenEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 60, unique: true }) name: string;
  @Column({ type: 'text', nullable: true }) description: string | null;

  @ManyToMany(() => DishEntity, (dish) => dish.allergens)
  dishes: DishEntity[];
}
```

**Як працює `cascade: true`.** У `POST /dishes` і `PATCH /dishes/:id` алергени передаються списком назв: `"allergens": ["Молоко", "Яйця", "Горіхи"]`. Сервіс шукає вже наявні алергени без урахування регістру (`LOWER(name) IN (...)`). Для нових назв він створює несохранені об'єкти через `allergenRepo.create({ name })`. Один виклик `dishRepo.save(dish)` вставляє нові алергени в `allergens`, а зв'язки в `dish_allergens`. Окремого `allergenRepo.save` немає.

DTO перевіряє список: масив рядків, не більше 14 елементів, без порожніх рядків і без дублікатів (`@ArrayUnique` без урахування регістру).

### 3.2. Життєвий цикл міграцій

```bash
npm run migration:generate -- src/database/migrations/AddAllergens
npm run migration:run
npm run migration:revert
npm run migration:run
```

`1794767804198-AddAllergens.ts` створює таблиці `allergens` і `dish_allergens`. У проміжної таблиці складений первинний ключ `(dish_id, allergen_id)`, індекси та два FK з `ON DELETE CASCADE`. Після `migration:revert` у базі лишаються тільки таблиці першої міграції, а в `migrations` — один запис. Після повторного `migration:run` усе повертається.

### 3.3. Фільтрація через QueryBuilder

`GET /dishes` підтримує нові параметри: `allergen` (назва, без урахування регістру), `allergenId` (UUID) і `menuCategoryId`. Їх можна поєднувати з пагінацією, сортуванням і фільтрами з ПР7.

```ts
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
```

Чому підзапит, а не просто `where('allergen.name = :allergen')`: умова на приєднаній таблиці відкидає «зайві» рядки join-у. Тоді у відповіді в масиві `allergens` лишився б тільки той алерген, за яким фільтрували. Підзапит відбирає `id` потрібних страв, а `innerJoinAndSelect` повертає всі їхні алергени. Значення передаються лише через іменовані параметри (`:allergen`, `:allergenId`), тож SQL-ін'єкції неможливі. Поле сортування підставляється в рядок тільки з білого списку `DISH_SORT_FIELDS`.

Маршрути алергенів: `GET /allergens`, `GET /allergens/:id` (разом зі стравами), `POST /allergens`, `DELETE /allergens/:id`.

---

## 4. Структура (нове та змінене)

```
PR8_WEB4/
├── .env.example
├── docker-compose.yml
├── requests.http
├── src/
│   ├── database/
│   │   ├── data-source.ts
│   │   ├── database.options.ts
│   │   └── migrations/
│   │       ├── 1794767602041-CreateRelations.ts
│   │       └── 1794767804198-AddAllergens.ts
│   ├── menu-categories/                 # 1:M
│   │   ├── entities/menu-category.entity.ts
│   │   ├── dto/
│   │   ├── menu-categories.controller.ts
│   │   ├── menu-categories.service.ts
│   │   └── menu-categories.module.ts
│   ├── allergens/                       # M:N
│   │   ├── entities/allergen.entity.ts
│   │   ├── dto/create-allergen.dto.ts
│   │   ├── allergens.controller.ts
│   │   ├── allergens.service.ts
│   │   └── allergens.module.ts
│   └── dishes/
│       ├── entities/dish.entity.ts      # @ManyToOne + @ManyToMany/@JoinTable
│       ├── dto/                         # menuCategoryId, allergens, фільтри
│       └── dishes.service.ts            # QueryBuilder, cascade
└── test/shop.e2e-spec.ts
```

---

## 5. Інструкція із запуску

```bash
npm install
cp .env.example .env
docker compose up -d
npm run migration:run
npm run start:dev
```

API: http://localhost:4000. Під час першого запуску в порожню БД додаються 4 розділи меню, 5 алергенів і 3 страви.

Корисні команди:

```bash
npm run migration:show
npm run migration:revert
docker exec -it food_delivery_pr8_postgres psql -U food_user -d food_delivery -c '\dt'
npm test
npm run test:e2e
```

`DB_LOGGING=true` у `.env` вмикає виведення SQL-запитів у консоль.

---

## 6. REST API

| Метод | Маршрут | Опис |
|---|---|---|
| `GET` | `/dishes?page&limit&sortBy&order&search&isSpicy&maxPrice&menuCategoryId&allergen&allergenId` | список, QueryBuilder |
| `GET` | `/dishes/:id` | страва з `menuCategory` і `allergens` |
| `POST` | `/dishes` | створення, `menuCategoryId`, `allergens: string[]` |
| `PATCH` | `/dishes/:id` | оновлення, зокрема заміна набору алергенів; `menuCategoryId: null` відв'язує розділ |
| `DELETE` | `/dishes/:id` | м'яке видалення |
| `GET` | `/menu-categories`, `/menu-categories/:id` | розділи меню, розділ разом зі стравами |
| `POST` / `PATCH` / `DELETE` | `/menu-categories[/:id]` | керування розділами |
| `GET` | `/allergens`, `/allergens/:id` | алергени, алерген разом зі стравами |
| `POST` / `DELETE` | `/allergens[/:id]` | керування алергенами |

---

## 7. Скриншоти

### 7.1. PostgreSQL у Docker
![](screenshots/01_docker_compose.png)

### 7.2. Генерація міграції `CreateRelations`
![](screenshots/02_generate_create_relations.png)

### 7.3. Застосування `migration:run`
![](screenshots/03_run_create_relations.png)

### 7.4. Таблиці та зовнішній ключ `menu_category_id` у `psql`
![](screenshots/04_psql_fk.png)

### 7.5. Створення страви та `GET /dishes/:id` із вкладеним `menuCategory`
![](screenshots/05_get_dish_with_category.png)

### 7.6. Розділ меню зі списком страв (`OneToMany`); неіснуючий розділ дає 404
![](screenshots/06_category_with_dishes.png)

### 7.7. Генерація міграції `AddAllergens`
![](screenshots/07_generate_add_allergens.png)

### 7.8. `migration:run`: з'явилися `allergens` і `dish_allergens`
![](screenshots/08_migration_run.png)

### 7.9. `migration:revert`: таблиці M:N видалено, у `migrations` лишився один запис
![](screenshots/09_migration_revert.png)

### 7.10. Повторний `migration:run` і структура `dish_allergens`
![](screenshots/10_migration_rerun.png)

### 7.11. Запуск застосунку з `synchronize: false`: DDL не виконується
![](screenshots/11_startup_no_sync.png)

### 7.12. `cascade: true`: нові алергени створюються разом зі стравою
![](screenshots/12_cascade_create.png)

### 7.13. Довідник алергенів після каскадного збереження
![](screenshots/13_allergens_list.png)

### 7.14. `GET /dishes?allergen=молоко`
![](screenshots/14_filter_by_allergen_name.png)

### 7.15. Фільтр за `allergenId` і комбінований фільтр «алерген + розділ меню»
![](screenshots/15_filter_by_id_and_category.png)

### 7.16. SQL, згенерований QueryBuilder (`INNER JOIN` + параметризований підзапит)
![](screenshots/16_querybuilder_sql.png)

### 7.17. Валідація (400)
![](screenshots/17_validation_400.png)

### 7.18. Вміст проміжної таблиці `dish_allergens`
![](screenshots/18_psql_join_table.png)

### 7.19. Тести без помилок: unit 23/23, e2e 1/1
![](screenshots/19_tests.png)

---

## 8. Висновки

Схема БД більше не синхронізується автоматично: кожна зміна фіксується файлом міграції з методами `up`/`down`. Це перевірено повним циклом `generate → run → revert → run`. Зв'язок 1:M реалізовано через `@ManyToOne` + `@JoinColumn` (FK на боці страви, `ON DELETE SET NULL`), зв'язок M:N — через `@ManyToMany` + `@JoinTable` з проміжною таблицею `dish_allergens`. Завдяки `cascade: true` нові алергени зберігаються одним `save` разом зі стравою. Пошук страв за алергеном побудовано через `createQueryBuilder` з `innerJoinAndSelect` і параметризованим `where`, з підтримкою пагінації та сортування.
