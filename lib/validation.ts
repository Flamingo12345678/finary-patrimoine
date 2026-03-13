import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(2),
  institution: z.string().min(2),
  type: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'CREDIT']),
  balance: z.coerce.number(),
  currency: z.string().default('EUR'),
});

export const assetSchema = z.object({
  accountId: z.string().cuid().optional().nullable(),
  name: z.string().min(2),
  category: z.enum(['CASH', 'EQUITY', 'BOND', 'REAL_ESTATE', 'CRYPTO', 'OTHER']),
  value: z.coerce.number(),
  costBasis: z.coerce.number().optional().nullable(),
  performancePct: z.coerce.number().optional().nullable(),
});

export const transactionSchema = z.object({
  accountId: z.string().cuid().optional().nullable(),
  label: z.string().min(2),
  amount: z.coerce.number(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT']),
  category: z.string().min(2),
  occurredAt: z.string().datetime().or(z.string().date()),
  note: z.string().optional().nullable(),
});

export const goalSchema = z.object({
  name: z.string().min(2),
  target: z.coerce.number().positive(),
  current: z.coerce.number().min(0),
  deadline: z.string().date().optional().nullable(),
});
