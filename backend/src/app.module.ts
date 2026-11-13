import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MembersModule } from './members/members.module.js';
import { CollectionsModule } from './collections/collections.module.js';
import { BillingModule } from './billing/billing.module.js';
import { AdjustmentsModule } from './adjustments/adjustments.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE ?? 'portal_accounting',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production' && process.env.DB_SYNCHRONIZE === 'true',
    }),
    AuthModule,
    MembersModule,
    CollectionsModule,
    BillingModule,
    AdjustmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
