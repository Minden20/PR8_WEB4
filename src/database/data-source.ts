import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database.options.js';

export default new DataSource({
  ...databaseOptions,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
});
