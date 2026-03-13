import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { accountSchema, assetSchema, csvImportSchema, normalizeDateInput, transactionSchema } from '@/lib/validation';
import { serializeAccount, serializeAsset, serializeTransaction } from '@/lib/serializers';
export { csvTemplates } from '@/lib/import-config';

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function parseDecimal(value: string | undefined, fallback = '0') {
  const normalized = (value ?? fallback).trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return 0;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`Nombre invalide: ${value}`);
  return parsed;
}

export function parseCsv(input: string, delimiter = ',') {
  const lines = input.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne.');

  const splitLine = (line: string) => {
    const result: string[] = [];
    let current = '';
    let quoted = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result.map((cell) => cell.trim());
  };

  const headers = splitLine(lines[0]).map(normalizeHeader);
  return lines.slice(1).map((line, index) => {
    const values = splitLine(line);
    return headers.reduce<Record<string, string>>((acc, header, headerIndex) => {
      acc[header] = values[headerIndex] ?? '';
      return acc;
    }, { __row: String(index + 2) });
  });
}

function mapAccount(row: Record<string, string>) {
  return accountSchema.parse({
    name: row.name || row.account_name,
    institution: row.institution || row.bank || row.provider,
    type: row.type,
    balance: parseDecimal(row.balance || row.amount),
    currency: row.currency || 'EUR',
  });
}

async function mapAsset(userId: string, row: Record<string, string>) {
  const accountName = row.account || row.account_name;
  let accountId: string | null = null;

  if (accountName) {
    const account = await prisma.account.findFirst({ where: { userId, name: accountName } });
    accountId = account?.id ?? null;
  }

  return assetSchema.parse({
    accountId,
    name: row.name || row.asset_name,
    category: row.category,
    value: parseDecimal(row.value || row.amount),
    costBasis: row.cost_basis ? parseDecimal(row.cost_basis) : null,
    performancePct: row.performance_pct ? parseDecimal(row.performance_pct) : null,
  });
}

async function mapTransaction(userId: string, row: Record<string, string>) {
  const accountName = row.account || row.account_name;
  let accountId: string | null = null;

  if (accountName) {
    const account = await prisma.account.findFirst({ where: { userId, name: accountName } });
    accountId = account?.id ?? null;
  }

  return transactionSchema.parse({
    accountId,
    label: row.label || row.description,
    amount: parseDecimal(row.amount),
    type: row.type,
    category: row.category || 'Non classée',
    occurredAt: row.occurred_at || row.date,
    note: row.note || null,
  });
}

export async function runCsvImport(input: unknown, userId: string) {
  const parsed = csvImportSchema.parse(input);
  const rows = parsed.rows;
  const preview: Array<Record<string, unknown>> = [];
  const errors: Array<{ row: string; message: string }> = [];
  let inserted = 0;

  if (parsed.entity === 'accounts') {
    const validRows = rows.flatMap((row) => {
      try {
        const mapped = mapAccount(row);
        preview.push(mapped);
        return [mapped];
      } catch (error) {
        errors.push({ row: row.__row ?? '?', message: error instanceof Error ? error.message : 'Ligne invalide' });
        return [];
      }
    });

    if (!parsed.dryRun && validRows.length > 0) {
      const created = await prisma.$transaction(validRows.map((data) => prisma.account.create({ data: { ...data, userId } })));
      inserted = created.length;
      return { inserted, errors, preview: created.slice(0, 5).map(serializeAccount), pipeline: 'csv/manual-upload/v1' };
    }
  }

  if (parsed.entity === 'assets') {
    const validRows: Prisma.AssetCreateManyInput[] = [];
    for (const row of rows) {
      try {
        const mapped = await mapAsset(userId, row);
        preview.push(mapped);
        validRows.push({ ...mapped, userId });
      } catch (error) {
        errors.push({ row: row.__row ?? '?', message: error instanceof Error ? error.message : 'Ligne invalide' });
      }
    }

    if (!parsed.dryRun && validRows.length > 0) {
      const result = await prisma.asset.createMany({ data: validRows });
      inserted = result.count;
      const assets = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: Math.min(inserted, 5) });
      return { inserted, errors, preview: assets.map(serializeAsset), pipeline: 'csv/manual-upload/v1' };
    }
  }

  if (parsed.entity === 'transactions') {
    const validRows: Prisma.TransactionCreateManyInput[] = [];
    for (const row of rows) {
      try {
        const mapped = await mapTransaction(userId, row);
        preview.push(mapped);
        validRows.push({ ...mapped, occurredAt: normalizeDateInput(mapped.occurredAt), userId });
      } catch (error) {
        errors.push({ row: row.__row ?? '?', message: error instanceof Error ? error.message : 'Ligne invalide' });
      }
    }

    if (!parsed.dryRun && validRows.length > 0) {
      const result = await prisma.transaction.createMany({ data: validRows });
      inserted = result.count;
      const transactions = await prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: Math.min(inserted, 5) });
      return { inserted, errors, preview: transactions.map(serializeTransaction), pipeline: 'csv/manual-upload/v1' };
    }
  }

  return { inserted, errors, preview: preview.slice(0, 5), pipeline: 'csv/manual-upload/v1' };
}

