import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Member } from '../members/member.entity.js';
import { Adjustment } from './adjustment.entity.js';

type BalanceComponent = 'principal' | 'interest' | 'penalty';
const balanceComponents: BalanceComponent[] = ['principal', 'interest', 'penalty'];

interface AdjustmentUser {
  id: number;
  username: string;
}

@Injectable()
export class AdjustmentsService {
  constructor(
    @InjectRepository(Adjustment) private readonly adjustmentsRepository: Repository<Adjustment>,
    @InjectRepository(Member) private readonly membersRepository: Repository<Member>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createAdjustment(body: Record<string, unknown>, user: AdjustmentUser) {
    const values = await this.validateAdjustment(body);
    const saved = await this.dataSource.transaction(async (manager) => {
      const member = await manager.findOne(Member, { where: { id: values.member.id } });
      if (!member) {
        throw new NotFoundException('The member linked to this adjustment was not found.');
      }

      const changes = balanceComponents
        .map((component) => ({ component, amount: values.amounts[component] }))
        .filter((change) => change.amount !== 0);

      for (const change of changes) {
        const next = this.toCents(member[change.component]) + change.amount;
        member[change.component] = this.fromCents(next);
      }
      await manager.save(Member, member);

      return Promise.all(changes.map((change) => manager.save(
        manager.create(Adjustment, {
          member,
          adjustmentDate: values.adjustmentDate,
          component: change.component,
          direction: change.amount > 0 ? 'increase' : 'decrease',
          amount: this.fromCents(Math.abs(change.amount)),
          reason: values.reason,
          createdByUserId: user.id,
          createdByUsername: user.username,
        }),
      )));
    });

    return saved.map((adjustment) => this.toAdjustmentResponse(adjustment, adjustment.member));
  }

  async listAdjustments() {
    const adjustments = await this.adjustmentsRepository.find({
      relations: { member: true },
      order: { adjustmentDate: 'DESC', id: 'DESC' },
      take: 100,
    });

    return adjustments.map((adjustment) => this.toAdjustmentResponse(adjustment, adjustment.member));
  }

  async deleteAdjustment(idValue: string) {
    const id = Number(idValue);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Adjustment id must be valid.');
    }

    await this.dataSource.transaction(async (manager) => {
      const adjustment = await manager.findOne(Adjustment, {
        where: { id },
        relations: { member: true },
      });
      if (!adjustment) {
        throw new NotFoundException('The adjustment was not found.');
      }

      const component = adjustment.component as BalanceComponent;
      if (!balanceComponents.includes(component)) {
        throw new BadRequestException('The adjustment has an unsupported balance component.');
      }

      const member = await manager.findOne(Member, { where: { id: adjustment.member.id } });
      if (!member) {
        throw new NotFoundException('The member linked to this adjustment was not found.');
      }

      const originalChange = adjustment.direction === 'increase'
        ? this.toCents(adjustment.amount)
        : -this.toCents(adjustment.amount);
      const revertedBalance = this.toCents(member[component]) - originalChange;
      member[component] = this.fromCents(revertedBalance);
      await manager.save(Member, member);
      await manager.remove(Adjustment, adjustment);
    });

    return { id };
  }

  private async validateAdjustment(body: Record<string, unknown>) {
    const blockLot = this.requiredText(body.blockLot, 'Block/Lot');
    const [block, lot, ...extraParts] = blockLot.split('/').map((part) => part.trim());
    if (!block || !lot || extraParts.length > 0) {
      throw new BadRequestException('Block/Lot must use the format 1/1.');
    }

    const adjustmentDate = this.requiredText(body.adjustmentDate, 'Adjustment date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(adjustmentDate) || Number.isNaN(Date.parse(`${adjustmentDate}T00:00:00Z`))) {
      throw new BadRequestException('Adjustment date must be a valid date.');
    }

    const amounts = {
      principal: this.toSignedAmount(body.principal, 'Principal'),
      interest: this.toSignedAmount(body.interest, 'Interest'),
      penalty: this.toSignedAmount(body.penalty, 'Penalty'),
    };
    if (balanceComponents.every((component) => amounts[component] === 0)) {
      throw new BadRequestException('Enter an amount for at least one balance component.');
    }
    const reason = this.requiredText(body.reason, 'Reason');
    if (reason.length > 2000) {
      throw new BadRequestException('Reason must not exceed 2,000 characters.');
    }

    const member = await this.membersRepository.findOne({ where: { block, lot } });
    if (!member) {
      throw new NotFoundException(`No member was found for Block/Lot ${block}/${lot}.`);
    }

    return { member, adjustmentDate, amounts, reason };
  }

  private toAdjustmentResponse(adjustment: Adjustment, member: Member) {
    return {
      id: adjustment.id,
      adjustmentDate: adjustment.adjustmentDate,
      component: adjustment.component,
      direction: adjustment.direction,
      amount: adjustment.amount,
      reason: adjustment.reason,
      createdByUsername: adjustment.createdByUsername,
      createdAt: adjustment.createdAt,
      member: {
        id: member.id,
        block: member.block,
        lot: member.lot,
        registeredOwners: member.registeredOwners,
      },
    };
  }

  private requiredText(value: unknown, field: string) {
    const text = String(value ?? '').trim();
    if (!text) {
      throw new BadRequestException(`${field} is required.`);
    }
    return text;
  }

  private toSignedAmount(value: unknown, field: string) {
    const text = String(value ?? '').trim().replace(/,/g, '');
    if (!text) {
      return 0;
    }
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount === 0 || !/^-?\d+(\.\d{1,2})?$/.test(text)) {
      throw new BadRequestException(`${field} must be a non-zero number with up to 2 decimal places.`);
    }
    return Math.round(amount * 100);
  }

  private toCents(value: unknown) {
    return Math.round(Number(value ?? 0) * 100);
  }

  private fromCents(value: number) {
    return (value / 100).toFixed(2);
  }
}
