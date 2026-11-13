import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Member } from '../members/member.entity.js';
import { Collection } from './collection.entity.js';

const paymentCategories = new Set([
  'Association dues',
  'Water dues',
  'ID/Stickers',
  'Swimming pool tickets',
  'Rental of facilities',
  'Construction bond',
  'Multi-purpose hall rental',
  'Others',
]);
const paymentTypes = new Set(['Cash', 'Online', 'Check', 'Bank transfer']);

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection) private readonly collectionsRepository: Repository<Collection>,
    @InjectRepository(Member) private readonly membersRepository: Repository<Member>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createCollection(body: Record<string, unknown>) {
    const values = await this.validateCollection(body);
    const saved = await this.dataSource.transaction(async (manager) => {
      const member = await manager.findOne(Member, { where: { id: values.member.id } });
      if (!member) {
        throw new NotFoundException('The member linked to this collection was not found.');
      }
      const allocation = this.applyPayment(member, values.netAmount);
      await manager.save(Member, member);
      const collection = manager.create(Collection, { ...values, member, ...allocation });
      return manager.save(Collection, collection);
    });

    return this.toCollectionResponse(saved, values.member);
  }

  async updateCollection(id: number, body: Record<string, unknown>) {
    const existing = await this.collectionsRepository.findOne({
      where: { id },
      relations: { member: true },
    });
    if (!existing) {
      throw new NotFoundException('The collection record was not found.');
    }

    const values = await this.validateCollection({ ...body, id });
    const saved = await this.dataSource.transaction(async (manager) => {
      const oldMember = await manager.findOne(Member, { where: { id: existing.member.id } });
      const newMember = await manager.findOne(Member, { where: { id: values.member.id } });
      if (!oldMember || !newMember) {
        throw new NotFoundException('The member linked to this collection was not found.');
      }

      this.reverseAllocation(oldMember, existing);
      const allocation = this.applyPayment(newMember, values.netAmount);
      await manager.save(Member, oldMember);
      if (newMember.id !== oldMember.id) {
        await manager.save(Member, newMember);
      }
      return manager.save(Collection, { ...existing, ...values, member: newMember, ...allocation });
    });
    return this.toCollectionResponse(saved, values.member);
  }

  async deleteCollection(id: number) {
    const deleted = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Collection, {
        where: { id },
        relations: { member: true },
      });
      if (!existing) {
        return false;
      }
      const member = await manager.findOne(Member, { where: { id: existing.member.id } });
      if (!member) {
        throw new NotFoundException('The member linked to this collection was not found.');
      }
      this.reverseAllocation(member, existing);
      await manager.save(Member, member);
      await manager.remove(Collection, existing);
      return true;
    });
    if (!deleted) {
      throw new NotFoundException('The collection record was not found.');
    }

    return { deleted: true };
  }

  private async validateCollection(body: Record<string, unknown>) {
    const blockLot = this.requiredText(body.blockLot, 'Block/Lot');
    const [block, lot, ...extraParts] = blockLot.split('/').map((part) => part.trim());

    if (!block || !lot || extraParts.length > 0) {
      throw new BadRequestException('Block/Lot must use the format 1/1.');
    }

    const collectionDate = this.requiredText(body.collectionDate, 'Collection date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(collectionDate) || Number.isNaN(Date.parse(`${collectionDate}T00:00:00Z`))) {
      throw new BadRequestException('Collection date must be a valid date.');
    }

    const referenceNumber = this.requiredText(body.referenceNumber, 'OR/reference number');
    if (referenceNumber.length > 100) {
      throw new BadRequestException('OR/reference number must not exceed 100 characters.');
    }
    const duplicate = await this.collectionsRepository.findOne({ where: { referenceNumber } });
    if (duplicate && duplicate.id !== Number(body.id)) {
      throw new BadRequestException('That OR/reference number has already been used.');
    }

    const amount = this.toAmount(body.amount);
    const discountPercentage = this.toDiscountPercentage(body.discountPercentage);
    const discountAmount = (Number(amount) * Number(discountPercentage) / 100).toFixed(2);
    const netAmount = (Number(amount) - Number(discountAmount)).toFixed(2);
    const paymentCategory = this.requiredText(body.paymentCategory, 'Payment category');
    if (!paymentCategories.has(paymentCategory)) {
      throw new BadRequestException('Payment category is not supported.');
    }

    const paymentType = this.requiredText(body.paymentType, 'Payment type');
    if (!paymentTypes.has(paymentType)) {
      throw new BadRequestException('Payment type is not supported.');
    }

    const remarks = body.remarks == null ? null : String(body.remarks).trim();
    if (remarks && remarks.length > 2000) {
      throw new BadRequestException('Remarks must not exceed 2,000 characters.');
    }

    const member = await this.membersRepository.findOne({ where: { block, lot } });
    if (!member) {
      throw new NotFoundException(`No member was found for Block/Lot ${block}/${lot}.`);
    }

    return {
      member,
      collectionDate,
      referenceNumber,
      amount,
      discountPercentage,
      discountAmount,
      netAmount,
      paymentCategory,
      paymentType,
      remarks: remarks || null,
    };
  }

  private toCollectionResponse(saved: Collection, member: Member) {
    return {
      id: saved.id,
      collectionDate: saved.collectionDate,
      referenceNumber: saved.referenceNumber,
      amount: saved.amount,
      discountPercentage: saved.discountPercentage,
      discountAmount: saved.discountAmount,
      netAmount: saved.netAmount,
      paymentCategory: saved.paymentCategory,
      paymentType: saved.paymentType,
      remarks: saved.remarks,
      member: {
        id: member.id,
        block: member.block,
        lot: member.lot,
        registeredOwners: member.registeredOwners,
      },
    };
  }

  private applyPayment(member: Member, netAmount: string) {
    let remaining = this.toCents(netAmount);
    const appliedPenalty = Math.min(remaining, Math.max(0, this.toCents(member.penalty)));
    remaining -= appliedPenalty;
    const appliedInterest = Math.min(remaining, Math.max(0, this.toCents(member.interest)));
    remaining -= appliedInterest;
    const appliedPrincipal = remaining;

    member.penalty = this.fromCents(this.toCents(member.penalty) - appliedPenalty);
    member.interest = this.fromCents(this.toCents(member.interest) - appliedInterest);
    member.principal = this.fromCents(this.toCents(member.principal) - appliedPrincipal);

    return {
      appliedPenalty: this.fromCents(appliedPenalty),
      appliedInterest: this.fromCents(appliedInterest),
      appliedPrincipal: this.fromCents(appliedPrincipal),
    };
  }

  private reverseAllocation(member: Member, collection: Collection) {
    member.penalty = this.fromCents(this.toCents(member.penalty) + this.toCents(collection.appliedPenalty));
    member.interest = this.fromCents(this.toCents(member.interest) + this.toCents(collection.appliedInterest));
    member.principal = this.fromCents(this.toCents(member.principal) + this.toCents(collection.appliedPrincipal));
  }

  private toCents(value: unknown) {
    return Math.round(Number(value ?? 0) * 100);
  }

  private fromCents(value: number) {
    return (value / 100).toFixed(2);
  }

  async listCollections() {
    const collections = await this.collectionsRepository.find({
      relations: { member: true },
      order: { collectionDate: 'DESC', id: 'DESC' },
      take: 100,
    });

    return collections.map((collection) => ({
      id: collection.id,
      collectionDate: collection.collectionDate,
      referenceNumber: collection.referenceNumber,
      amount: collection.amount,
      discountPercentage: collection.discountPercentage,
      discountAmount: collection.discountAmount,
      netAmount: collection.netAmount,
      paymentCategory: collection.paymentCategory,
      paymentType: collection.paymentType,
      remarks: collection.remarks,
      member: {
        block: collection.member.block,
        lot: collection.member.lot,
        registeredOwners: collection.member.registeredOwners,
      },
    }));
  }

  private requiredText(value: unknown, field: string) {
    const text = String(value ?? '').trim();
    if (!text) {
      throw new BadRequestException(`${field} is required.`);
    }
    return text;
  }

  private toAmount(value: unknown) {
    const text = String(value ?? '').trim().replace(/,/g, '');
    const amount = Number(text);
    if (!text || !Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,2})?$/.test(text)) {
      throw new BadRequestException('Amount must be a positive number with up to 2 decimal places.');
    }
    return amount.toFixed(2);
  }

  private toDiscountPercentage(value: unknown) {
    const text = String(value ?? '0').trim();
    const percentage = Number(text);
    if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      throw new BadRequestException('Discount must be a percentage from 0 to 100 with up to 2 decimal places.');
    }
    return percentage.toFixed(2);
  }
}
