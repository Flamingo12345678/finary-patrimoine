import { describe, expect, it } from 'vitest';
import { normalizeDateInput, transactionSchema } from './validation';

describe('normalizeDateInput', () => {
  it('normalizes yyyy-mm-dd values to a valid Date', () => {
    const parsed = normalizeDateInput('2026-03-02');
    expect(parsed.toISOString()).toBe('2026-03-02T00:00:00.000Z');
  });

  it('rejects invalid dates', () => {
    expect(() => normalizeDateInput('not-a-date')).toThrow(/Date invalide/);
  });
});

describe('transactionSchema', () => {
  it('accepts a valid transaction payload', () => {
    const parsed = transactionSchema.parse({
      label: 'Salaire',
      amount: 2500,
      type: 'INCOME',
      category: 'Revenus',
      occurredAt: '2026-03-02',
      note: 'Mars',
    });

    expect(parsed.label).toBe('Salaire');
    expect(parsed.note).toBe('Mars');
  });

  it('normalizes empty notes to null', () => {
    const parsed = transactionSchema.parse({
      label: 'Loyer',
      amount: -950,
      type: 'EXPENSE',
      category: 'Logement',
      occurredAt: '2026-03-03',
      note: '   ',
    });

    expect(parsed.note).toBeNull();
  });
});
