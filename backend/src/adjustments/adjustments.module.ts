import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../members/member.entity.js';
import { Adjustment } from './adjustment.entity.js';
import { AdjustmentsController } from './adjustments.controller.js';
import { AdjustmentsService } from './adjustments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Adjustment, Member])],
  controllers: [AdjustmentsController],
  providers: [AdjustmentsService],
})
export class AdjustmentsModule {}
