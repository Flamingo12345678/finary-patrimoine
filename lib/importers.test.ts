import { describe, expect, it } from 'vitest';
import { parseCsv } from './importers';

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
