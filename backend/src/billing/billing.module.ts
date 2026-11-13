import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../members/member.entity.js';
import { Billing } from './billing.entity.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Billing, Member])],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
