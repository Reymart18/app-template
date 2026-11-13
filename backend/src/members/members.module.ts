import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller.js';
import { Member } from './member.entity.js';
import { MembersService } from './members.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Member])],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
