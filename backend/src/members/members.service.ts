import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { DataSource, Repository } from 'typeorm';
import { Member } from './member.entity.js';

const expectedHeaders = [
  'BLOCK',
  'LOT',
  'REGISTERED OWNER/S',
  'SQM SIZE',
  'CLASSIFICATION (HO/LO)',
  'PRINCIPAL',
  'INTEREST',
  'PENALTY',
];

interface UploadedWorkbook {
  buffer: Buffer;
  originalname: string;
}

interface ImportedMember {
  block: string;
  lot: string;
  registeredOwners: string | null;
  sqmSize: string | null;
  classification: string;
  principal: string;
  interest: string;
  penalty: string;
}

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member) private readonly membersRepository: Repository<Member>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createMember(body: Record<string, unknown>) {
    const values = this.validateMemberDetails(body, true);
    const existing = await this.membersRepository.findOne({ where: { block: values.block, lot: values.lot } });
    if (existing) {
      throw new BadRequestException('A member with that Block and Lot already exists.');
    }

    const member = this.membersRepository.create({
      ...values,
    });
    return this.membersRepository.save(member);
  }

  async updateMember(id: number, body: Record<string, unknown>) {
    const existing = await this.membersRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('The member record was not found.');
    }

    const values = this.validateMemberDetails(body, false);
    const duplicate = await this.membersRepository.findOne({ where: { block: values.block, lot: values.lot } });
    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException('A member with that Block and Lot already exists.');
    }

    return this.membersRepository.save({
      ...existing,
      ...values,
      sqmSize: existing.sqmSize,
      principal: existing.principal,
      interest: existing.interest,
      penalty: existing.penalty,
    });
  }

  async importMasterlist(file?: UploadedWorkbook) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Select an Excel masterlist file before importing.');
    }

    if (!/\.(xlsx|xls)$/i.test(file.originalname)) {
      throw new BadRequestException('Only .xlsx and .xls files are supported.');
    }

    const members = this.parseWorkbook(file.buffer);
    let inserted = 0;
    let updated = 0;

    await this.dataSource.transaction(async (manager) => {
      for (const member of members) {
        const existing = await manager.findOne(Member, {
          where: { block: member.block, lot: member.lot },
        });

        if (existing) {
          await manager.save(Member, { ...existing, ...member });
          updated += 1;
        } else {
          await manager.save(Member, manager.create(Member, member));
          inserted += 1;
        }
      }
    });

    return { inserted, updated, total: members.length };
  }

  async listMembers(pageValue?: string, searchValue?: string) {
    const page = this.toPageNumber(pageValue);
    const limit = 25;
    const search = searchValue?.trim().slice(0, 100);
    const query = this.membersRepository
      .createQueryBuilder('member')
      .orderBy('member.block', 'ASC')
      .addOrderBy('member.lot', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.where(
        'member.block LIKE :search OR member.lot LIKE :search OR member.registeredOwners LIKE :search OR member.email LIKE :search OR member.cellphoneNumber LIKE :search OR member.telephoneNumber LIKE :search',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async lookupMember(blockValue?: string, lotValue?: string) {
    const block = blockValue?.trim();
    const lot = lotValue?.trim();

    if (!block || !lot) {
      throw new BadRequestException('Both Block and Lot are required.');
    }

    const member = await this.membersRepository.findOne({ where: { block, lot } });
    if (!member) {
      return null;
    }

    return member;
  }

  private validateMemberDetails(body: Record<string, unknown>, includeFinancials: boolean) {
    const block = this.requiredText(body.block, 'BLOCK');
    const lot = this.requiredText(body.lot, 'LOT');
    const classification = this.requiredText(body.classification, 'CLASSIFICATION (HO/LO)').toUpperCase();
    if (!['HO', 'LO'].includes(classification)) {
      throw new BadRequestException('CLASSIFICATION (HO/LO) must be HO or LO.');
    }

    const registeredOwners = this.optionalText(body.registeredOwners);
    if (registeredOwners && registeredOwners.length > 2000) {
      throw new BadRequestException('REGISTERED OWNER/S must not exceed 2,000 characters.');
    }
    const email = this.optionalEmail(body.email);
    const cellphoneNumber = this.optionalPhoneNumber(body.cellphoneNumber, 'Cellphone number');
    const telephoneNumber = this.optionalPhoneNumber(body.telephoneNumber, 'Telephone number');

    if (!includeFinancials) {
      return { block, lot, registeredOwners, email, cellphoneNumber, telephoneNumber, classification };
    }

    return {
      block,
      lot,
      registeredOwners,
      email,
      cellphoneNumber,
      telephoneNumber,
      classification,
      sqmSize: this.optionalDirectDecimal(body.sqmSize, 'SQM size'),
      principal: this.requiredDirectDecimal(body.principal, 'Principal'),
      interest: this.requiredDirectDecimal(body.interest, 'Interest'),
      penalty: this.requiredDirectDecimal(body.penalty, 'Penalty'),
    };
  }

  private optionalDirectDecimal(value: unknown, field: string) {
    return value == null || String(value).trim() === '' ? null : this.validateDirectDecimal(value, field);
  }

  private optionalEmail(value: unknown) {
    const email = this.optionalText(value);
    if (!email) {
      return null;
    }
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Email must be a valid email address.');
    }
    return email.toLowerCase();
  }

  private optionalPhoneNumber(value: unknown, field: string) {
    const number = this.optionalText(value);
    if (!number) {
      return null;
    }
    if (!/^\d{1,19}$/.test(number)) {
      throw new BadRequestException(`${field} must contain up to 19 digits.`);
    }
    return number;
  }

  private requiredDirectDecimal(value: unknown, field: string) {
    if (value == null || String(value).trim() === '') {
      throw new BadRequestException(`${field} is required.`);
    }
    return this.validateDirectDecimal(value, field);
  }

  private validateDirectDecimal(value: unknown, field: string) {
    const text = String(value).trim().replace(/,/g, '');
    const numberValue = Number(text);
    if (!text || !Number.isFinite(numberValue) || numberValue < 0 || !/^\d+(\.\d{1,2})?$/.test(text)) {
      throw new BadRequestException(`${field} must be a non-negative number with up to 2 decimal places.`);
    }
    return numberValue.toFixed(2);
  }

  private parseWorkbook(buffer: Buffer): ImportedMember[] {
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    } catch {
      throw new BadRequestException('The selected file is not a readable Excel workbook.');
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException('The workbook does not contain a worksheet.');
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
      header: 1,
      defval: null,
      blankrows: false,
    });
    const headerRowIndex = rows.findIndex((row) => {
      const normalizedRow = row.map((header) => this.normalizeHeader(header));
      return expectedHeaders.every((header) => normalizedRow.includes(header));
    });

    if (headerRowIndex === -1) {
      throw new BadRequestException(`Missing required column(s): ${expectedHeaders.join(', ')}.`);
    }

    const normalizedHeaders = rows[headerRowIndex].map((header) => this.normalizeHeader(header));
    const dataRows = rows.slice(headerRowIndex + 1);

    const missingHeaders = expectedHeaders.filter((header) => !normalizedHeaders.includes(header));
    if (missingHeaders.length > 0) {
      throw new BadRequestException(`Missing required column(s): ${missingHeaders.join(', ')}.`);
    }

    if (dataRows.length === 0) {
      throw new BadRequestException('The masterlist does not contain any member rows.');
    }

    const headerIndex = new Map(normalizedHeaders.map((header, index) => [header, index]));
    const memberKeys = new Set<string>();

    return dataRows.map((row, index) => {
      const spreadsheetRow = headerRowIndex + index + 2;
      const member = this.toImportedMember(row, headerIndex, spreadsheetRow);
      const memberKey = `${member.block.toUpperCase()}::${member.lot.toUpperCase()}`;

      if (memberKeys.has(memberKey)) {
        throw new BadRequestException(`Duplicate BLOCK and LOT at row ${spreadsheetRow}.`);
      }

      memberKeys.add(memberKey);
      return member;
    });
  }

  private toImportedMember(row: unknown[], headerIndex: Map<string, number>, rowNumber: number): ImportedMember {
    const valueFor = (header: string) => row[headerIndex.get(header) ?? -1];
    const block = this.requiredText(valueFor('BLOCK'), 'BLOCK', rowNumber);
    const lot = this.requiredText(valueFor('LOT'), 'LOT', rowNumber);
    const classification = this.requiredText(valueFor('CLASSIFICATION (HO/LO)'), 'CLASSIFICATION (HO/LO)', rowNumber).toUpperCase();

    if (!['HO', 'LO'].includes(classification)) {
      throw new BadRequestException(`CLASSIFICATION (HO/LO) at row ${rowNumber} must be HO or LO.`);
    }

    return {
      block,
      lot,
      registeredOwners: this.optionalText(valueFor('REGISTERED OWNER/S')),
      sqmSize: this.optionalDecimal(valueFor('SQM SIZE'), 'SQM SIZE', rowNumber),
      classification,
      principal: this.requiredDecimal(valueFor('PRINCIPAL'), 'PRINCIPAL', rowNumber),
      interest: this.requiredDecimal(valueFor('INTEREST'), 'INTEREST', rowNumber),
      penalty: this.requiredDecimal(valueFor('PENALTY'), 'PENALTY', rowNumber),
    };
  }

  private normalizeHeader(value: unknown) {
    return String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
  }

  private requiredText(value: unknown, field: string, rowNumber?: number) {
    const text = this.optionalText(value);
    if (!text) {
      throw new BadRequestException(rowNumber ? `${field} is required at row ${rowNumber}.` : `${field} is required.`);
    }
    return text;
  }

  private optionalText(value: unknown) {
    const text = String(value ?? '').trim();
    return text || null;
  }

  private requiredDecimal(value: unknown, field: string, rowNumber: number) {
    const decimal = this.optionalDecimal(value, field, rowNumber);
    if (decimal === null) {
      throw new BadRequestException(`${field} is required at row ${rowNumber}.`);
    }
    return decimal;
  }

  private optionalDecimal(value: unknown, field: string, rowNumber: number) {
    const text = String(value ?? '').trim();
    if (!text) {
      return null;
    }

    const numericValue = Number(text.replace(/,/g, ''));
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      throw new BadRequestException(`${field} at row ${rowNumber} must be a non-negative number.`);
    }

    return numericValue.toFixed(2);
  }

  private toPageNumber(value?: string) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
  }
}
