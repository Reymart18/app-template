import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../members/member.entity.js';
import { Collection } from './collection.entity.js';
import { CollectionsController } from './collections.controller.js';
import { CollectionsService } from './collections.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, Member])],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule { }
