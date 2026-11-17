import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DishesModule } from './dishes/dishes.module.js';
import { MenuCategoriesModule } from './menu-categories/menu-categories.module.js';
import { AllergensModule } from './allergens/allergens.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { SharedModule } from './shared/shared.module.js';
import { HttpLoggingMiddleware } from './common/middleware/http-logger.middleware.js';
import { databaseOptions } from './database/database.options.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'online-store',
    }),
    TypeOrmModule.forRoot({
      ...databaseOptions,
      autoLoadEntities: true,
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
    }),
    DishesModule,
    MenuCategoriesModule,
    AllergensModule,
    OrdersModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggingMiddleware).forRoutes('*');
  }
}
