import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdjustmentsService } from './adjustments.service.js';

interface AuthenticatedRequest {
  user: {
    id: number;
    username: string;
  };
}

@Controller('adjustments')
@UseGuards(JwtAuthGuard)
export class AdjustmentsController {
  constructor(private readonly adjustmentsService: AdjustmentsService) {}

  @Post()
  createAdjustment(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return this.adjustmentsService.createAdjustment(body, request.user);
  }

  @Get()
  listAdjustments() {
    return this.adjustmentsService.listAdjustments();
  }

  @Delete(':id')
  deleteAdjustment(@Param('id') id: string) {
    return this.adjustmentsService.deleteAdjustment(id);
  }
}
