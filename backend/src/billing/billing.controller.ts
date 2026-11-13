import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BillingService } from './billing.service.js';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('generate')
  generateMonthlyBilling(@Body() body: Record<string, unknown>) {
    return this.billingService.generateMonthlyBilling(body);
  }

  @Get()
  listBillings() {
    return this.billingService.listBillings();
  }
}
