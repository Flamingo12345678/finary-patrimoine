import { describe, expect, it } from 'vitest';
import { parseCsv, parseOfx, parseQif } from './importers';

describe('parseCsv', () => {
  it('supports comma-delimited CSV with normalized headers', () => {
    const rows = parseCsv('Label,Amount,Type\nSalaire,2500,INCOME');
    expect(rows).toEqual([
      { __row: '2', label: 'Salaire', amount: '2500', type: 'INCOME' },
    ]);
  });

  it('supports semicolon-delimited CSV with quoted values', () => {
    const rows = parseCsv('label;note\n"Virement";"Compte ""joint"""', ';');
    expect(rows[0]).toEqual({ __row: '2', label: 'Virement', note: 'Compte "joint"' });
  });

  it('throws when the CSV does not contain data rows', () => {
    expect(() => parseCsv('label,amount')).toThrow(/au moins un en-tête et une ligne/);
  });
});

describe('parseOfx', () => {
  it('extracts transaction rows from OFX', () => {
    const rows = parseOfx('<OFX><BANKTRANLIST><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260305<TRNAMT>-54.90<FITID>abc123<NAME>Supermarché<MEMO>Courses foyer</STMTTRN></BANKTRANLIST></OFX>');
    expect(rows[0]).toMatchObject({ label: 'Supermarché', amount: '-54.90', type: 'EXPENSE', date: '2026-03-05' });
  });
});

describe('parseQif', () => {
  it('extracts transaction rows from QIF', () => {
    const rows = parseQif('!Type:Bank\nD03/05/2026\nT-54.90\nPSupermarché\nMVie courante\n^');
    expect(rows[0]).toMatchObject({ label: 'Supermarché', amount: '-54.90', type: 'EXPENSE' });
  });
});
