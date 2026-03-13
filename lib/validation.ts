import { z } from 'zod';

const cuidish = z.string().min(1);
const optionalText = z.string().trim().optional().nullable().transform((value) => value && value.length > 0 ? value : null);

export const accountTypes = ['CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'CREDIT'] as const;
export const assetCategories = ['CASH', 'EQUITY', 'BOND', 'REAL_ESTATE', 'CRYPTO', 'OTHER'] as const;
export const transactionTypes = ['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT'] as const;
export const importEntities = ['accounts', 'assets', 'transactions'] as const;

export const accountSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(120),
  institution: z.string().trim().min(2, 'Établissement trop court').max(120),
  type: z.enum(accountTypes),
  balance: z.coerce.number().finite(),
  currency: z.string().trim().min(3).max(8).default('EUR'),
});

export const accountUpdateSchema = accountSchema.partial().refine((value) => Object.keys(value).length > 0, 'Aucune donnée à mettre à jour');

export const assetSchema = z.object({
  accountId: cuidish.optional().nullable(),
  name: z.string().trim().min(2).max(120),
  category: z.enum(assetCategories),
  value: z.coerce.number().finite(),
  costBasis: z.coerce.number().finite().optional().nullable(),
  performancePct: z.coerce.number().finite().optional().nullable(),
});

export const assetUpdateSchema = assetSchema.partial().refine((value) => Object.keys(value).length > 0, 'Aucune donnée à mettre à jour');

export const transactionSchema = z.object({
  accountId: cuidish.optional().nullable(),
  label: z.string().trim().min(2).max(160),
  amount: z.coerce.number().finite(),
  type: z.enum(transactionTypes),
  category: z.string().trim().min(2).max(80),
  occurredAt: z.string().trim().min(1),
  note: optionalText,
});

export const transactionUpdateSchema = transactionSchema.partial().refine((value) => Object.keys(value).length > 0, 'Aucune donnée à mettre à jour');

export const goalSchema = z.object({
  name: z.string().trim().min(2).max(120),
  target: z.coerce.number().positive(),
  current: z.coerce.number().min(0),
  deadline: optionalText,
});

export const goalUpdateSchema = goalSchema.partial().refine((value) => Object.keys(value).length > 0, 'Aucune donnée à mettre à jour');

export const csvImportSchema = z.object({
  entity: z.enum(importEntities),
  delimiter: z.enum([',', ';']).default(','),
  dryRun: z.coerce.boolean().default(true),
  rows: z.array(z.record(z.string(), z.string())).min(1, 'CSV vide'),
});

export function normalizeDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Date requise');

  const isoCandidate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00.000Z` : trimmed;
  const parsed = new Date(isoCandidate);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Date invalide: ${value}`);
  return parsed;
}
