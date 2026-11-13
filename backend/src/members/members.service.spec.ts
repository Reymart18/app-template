import XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { MembersService } from './members.service.js';

describe('MembersService', () => {
  it('reads a masterlist when title rows appear above the required headings', () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['PARKPLACE VILLAGE HOMEOWNERS ASSOCIATION INC. (PVHAI)'],
      ['HOMEOWNER PORTAL MASTERLIST'],
      ['BLOCK', 'LOT', 'REGISTERED OWNER/S', 'SQM SIZE', 'CLASSIFICATION (HO/LO)', 'PRINCIPAL', 'INTEREST', 'PENALTY'],
      ['1', '2', 'Sample Owner', 180, 'HO', 9000, 850, 35],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HOA Masterlist');
    const service = new MembersService({} as never, {} as never);

    const parsedMembers = service['parseWorkbook'](XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));

    expect(parsedMembers).toEqual([
      {
        block: '1',
        lot: '2',
        registeredOwners: 'Sample Owner',
        sqmSize: '180.00',
        classification: 'HO',
        principal: '9000.00',
        interest: '850.00',
        penalty: '35.00',
      },
    ]);
  });
});
