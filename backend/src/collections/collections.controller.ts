import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CollectionsService } from './collections.service.js';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  createCollection(@Body() body: Record<string, unknown>) {
    return this.collectionsService.createCollection(body);
  }

  @Patch(':id')
  updateCollection(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.collectionsService.updateCollection(id, body);
  }

  @Delete(':id')
  deleteCollection(@Param('id', ParseIntPipe) id: number) {
    return this.collectionsService.deleteCollection(id);
  }

  @Get()
  listCollections() {
    return this.collectionsService.listCollections();
  }
}
