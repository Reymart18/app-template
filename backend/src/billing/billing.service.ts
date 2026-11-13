import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Member } from '../members/member.entity.js';
import { Billing } from './billing.entity.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing) private readonly billingRepository: Repository<Billing>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async generateMonthlyBilling(body: Record<string, unknown>) {
    const billingMonth = this.toBillingMonth(body.billingMonth);
    const rate = this.toRate(body.rate);

    return this.dataSource.transaction(async (manager) => {
      const members = await manager.find(Member, { order: { block: 'ASC', lot: 'ASC' } });
      const existing = await manager.find(Billing, {
        where: { billingMonth },
        relations: { member: true },
      });
      const existingMemberIds = new Set(existing.map((billing) => billing.member.id));
      const billings: Billing[] = [];
      let skippedExisting = 0;
      let skippedMissingSqm = 0;

      for (const member of members) {
        if (existingMemberIds.has(member.id)) {
          skippedExisting += 1;
          continue;
        }
        if (member.sqmSize == null) {
          skippedMissingSqm += 1;
          continue;
        }

        const previousPrincipal = this.fromCents(this.toCents(member.principal));
        const previousInterest = this.fromCents(this.toCents(member.interest));
        const previousPenalty = this.fromCents(this.toCents(member.penalty));
        const principalAmount = this.fromCents(this.toCents(member.sqmSize) * this.toCents(rate) / 100);
        const billing = manager.create(Billing, {
          member,
          billingMonth,
          rate,
          amount: principalAmount,
          principal: principalAmount,
          interest: '0.00',
          penalty: '0.00',
          previousPrincipal,
          previousInterest,
          previousPenalty,
        });
        member.principal = this.fromCents(this.toCents(member.principal) + this.toCents(billing.principal));
        await manager.save(Member, member);
        billings.push(billing);
      }

      if (billings.length > 0) {
        await manager.save(Billing, billings);
      }

      return {
        billingMonth,
        rate,
        created: billings.length,
        skippedExisting,
        skippedMissingSqm,
      };
    });
  }

  async listBillings() {
    const billings = await this.billingRepository.find({
      relations: { member: true },
      order: { billingMonth: 'DESC', id: 'DESC' },
      take: 100,
    });

    return billings.map((billing) => ({
      id: billing.id,
      billingMonth: billing.billingMonth,
      rate: billing.rate,
      amount: billing.amount,
      principal: billing.principal,
      interest: billing.interest,
      penalty: billing.penalty,
      previousPrincipal: billing.previousPrincipal,
      previousInterest: billing.previousInterest,
      previousPenalty: billing.previousPenalty,
      member: {
        block: billing.member.block,
        lot: billing.member.lot,
        registeredOwners: billing.member.registeredOwners,
        sqmSize: billing.member.sqmSize,
      },
    }));
  }

  private toBillingMonth(value: unknown) {
    const month = String(value ?? '').trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('Billing month must use the YYYY-MM format.');
    }
    return month;
  }

  private toRate(value: unknown) {
    const text = String(value ?? '').trim();
    const rate = Number(text);
    if (!text || !Number.isFinite(rate) || rate <= 0 || !/^\d+(\.\d{1,2})?$/.test(text)) {
      throw new BadRequestException('Association rate must be a positive number with up to 2 decimal places.');
    }
    return rate.toFixed(2);
  }

  private toCents(value: unknown) {
    return Math.round(Number(value ?? 0) * 100);
  }

  private fromCents(value: number) {
    return (value / 100).toFixed(2);
  }
}
