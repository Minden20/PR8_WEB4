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
