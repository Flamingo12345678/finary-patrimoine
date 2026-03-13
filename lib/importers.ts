import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { accountSchema, assetSchema, csvImportSchema, normalizeDateInput, transactionSchema } from '@/lib/validation';
import { serializeAccount, serializeAsset, serializeTransaction } from '@/lib/serializers';
import { buildViewWhere, getActiveHousehold, resolveOwnerAndVisibility, type ViewMode } from '@/lib/household';
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

export function parseQif(input: string) {
  const rows: Record<string, string>[] = [];
  let current: Record<string, string> = {};

  for (const rawLine of input.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('!')) continue;
    if (line === '^') {
      if (Object.keys(current).length > 0) rows.push(current);
      current = {};
      continue;
    }
    const key = line[0];
    const value = line.slice(1).trim();
    if (key === 'D') current.date = value;
    if (key === 'T') current.amount = value;
    if (key === 'P') current.label = value;
    if (key === 'M') current.note = value;
    if (key === 'L') current.category = value;
  }

  return rows.map((row, index) => ({ __row: String(index + 1), ...row, type: parseDecimal(row.amount) >= 0 ? 'INCOME' : 'EXPENSE' }));
}

export function parseOfx(input: string) {
  const blocks = input.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  return blocks.map((block, index) => {
    const extract = (tag: string) => {
      const match = block.match(new RegExp(`<${tag}>([^<\r\n]+)`, 'i'));
      return match?.[1]?.trim() ?? '';
    };
    const dtposted = extract('DTPOSTED');
    const y = dtposted.slice(0, 4);
    const m = dtposted.slice(4, 6);
    const d = dtposted.slice(6, 8);
    return {
      __row: String(index + 1),
      label: extract('NAME') || extract('MEMO') || 'Transaction OFX',
      note: extract('MEMO') || null,
      category: extract('TRNTYPE') || 'Import OFX',
      amount: extract('TRNAMT'),
      date: `${y}-${m}-${d}`,
      type: parseDecimal(extract('TRNAMT')) >= 0 ? 'INCOME' : 'EXPENSE',
      external_id: extract('FITID'),
    };
  });
}

async function resolveOwnerUserId(householdId: string, row: Record<string, string>, defaultUserId: string, view: ViewMode) {
  const explicitVisibility = row.visibility?.toUpperCase();
  if (explicitVisibility === 'SHARED' || view === 'shared') return null;
  const ownerEmail = row.owner_email?.trim().toLowerCase();
  if (!ownerEmail) return defaultUserId;
  const member = await prisma.householdMember.findFirst({ where: { householdId, user: { email: ownerEmail } }, include: { user: true } });
  if (!member) throw new Error(`Membre introuvable pour owner_email=${ownerEmail}`);
  return member.userId;
}

async function resolveAccountId(householdId: string, row: Record<string, string>) {
  const accountName = row.account || row.account_name;
  if (!accountName) return null;
  const account = await prisma.account.findFirst({ where: { householdId, name: accountName } });
  return account?.id ?? null;
}

function dedupeKey(entity: string, row: Record<string, string | null | number>) {
  return [entity, row.label ?? row.name ?? '', row.amount ?? row.value ?? row.balance ?? '', row.date ?? row.occurredAt ?? '', row.account ?? row.accountId ?? '', row.visibility ?? '', row.ownerUserId ?? ''].join('::');
}

export async function runCsvImport(input: unknown, userId: string) {
  const parsed = csvImportSchema.parse(input);
  const rows = parsed.rows;
  const preview: Array<Record<string, unknown>> = [];
  const errors: Array<{ row: string; message: string }> = [];
  const seen = new Set<string>();
  let inserted = 0;

  const household = await getActiveHousehold(userId);
  const baseScope = resolveOwnerAndVisibility(parsed.view, userId);

  if (parsed.entity === 'accounts') {
    const validRows: Prisma.AccountCreateManyInput[] = [];
    for (const row of rows) {
      try {
        const ownerUserId = await resolveOwnerUserId(household.id, row, baseScope.ownerUserId ?? userId, parsed.view);
        const visibility = row.visibility?.toUpperCase() === 'SHARED' ? 'SHARED' : ownerUserId ? 'PERSONAL' : 'SHARED';
        const parsedAccount = accountSchema.parse({
          name: row.name || row.account_name,
          institution: row.institution || row.bank || row.provider,
          type: row.type,
          balance: parseDecimal(row.balance || row.amount),
          currency: row.currency || 'EUR',
        });
        const { view: _view, ...mapped } = parsedAccount;
        const key = dedupeKey('account', { ...row, ownerUserId, visibility });
        if (seen.has(key)) continue;
        seen.add(key);
        const exists = await prisma.account.findFirst({ where: { householdId: household.id, name: mapped.name, institution: mapped.institution, visibility, ownerUserId } });
        if (exists) continue;
        preview.push({ ...mapped, visibility, ownerUserId });
        validRows.push({ ...mapped, householdId: household.id, ownerUserId, visibility });
      } catch (error) {
        errors.push({ row: row.__row ?? '?', message: error instanceof Error ? error.message : 'Ligne invalide' });
      }
    }
    if (!parsed.dryRun && validRows.length > 0) {
      const result = await prisma.account.createMany({ data: validRows });
      inserted = result.count;
      const created = await prisma.account.findMany({ where: { householdId: household.id }, include: { ownerUser: true }, orderBy: { createdAt: 'desc' }, take: Math.min(inserted, 5) });
      return { inserted, errors, preview: created.map(serializeAccount), pipeline: `${parsed.format}/manual-upload/v2` };
    }
  }

  if (parsed.entity === 'assets') {
    const validRows: Prisma.AssetCreateManyInput[] = [];
    for (const row of rows) {
      try {
        const ownerUserId = await resolveOwnerUserId(household.id, row, baseScope.ownerUserId ?? userId, parsed.view);
        const visibility = row.visibility?.toUpperCase() === 'SHARED' ? 'SHARED' : ownerUserId ? 'PERSONAL' : 'SHARED';
        const accountId = await resolveAccountId(household.id, row);
        const parsedAsset = assetSchema.parse({
          accountId,
          name: row.name || row.asset_name,
          category: row.category,
          value: parseDecimal(row.value || row.amount),
          costBasis: row.cost_basis ? parseDecimal(row.cost_basis) : null,
          performancePct: row.performance_pct ? parseDecimal(row.performance_pct) : null,
        });
        const { view: _view, ...mapped } = parsedAsset;
        const key = dedupeKey('asset', { ...row, accountId, ownerUserId, visibility });
        if (seen.has(key)) continue;
        seen.add(key);
        const exists = await prisma.asset.findFirst({ where: { householdId: household.id, name: mapped.name, accountId, value: mapped.value, visibility, ownerUserId } });
        if (exists) continue;
        preview.push({ ...mapped, visibility, ownerUserId });
        validRows.push({ ...mapped, householdId: household.id, ownerUserId, visibility });
      } catch (error) {
        errors.push({ row: row.__row ?? '?', message: error instanceof Error ? error.message : 'Ligne invalide' });
      }
    }
    if (!parsed.dryRun && validRows.length > 0) {
      const result = await prisma.asset.createMany({ data: validRows });
      inserted = result.count;
      const assets = await prisma.asset.findMany({ where: buildViewWhere('household', userId, household.id), include: { ownerUser: true }, orderBy: { createdAt: 'desc' }, take: Math.min(inserted, 5) });
      return { inserted, errors, preview: assets.map(serializeAsset), pipeline: `${parsed.format}/manual-upload/v2` };
    }
  }

  if (parsed.entity === 'transactions') {
    const validRows: Prisma.TransactionCreateManyInput[] = [];
    for (const row of rows) {
      try {
        const ownerUserId = await resolveOwnerUserId(household.id, row, baseScope.ownerUserId ?? userId, parsed.view);
        const visibility = row.visibility?.toUpperCase() === 'SHARED' ? 'SHARED' : ownerUserId ? 'PERSONAL' : 'SHARED';
        const accountId = await resolveAccountId(household.id, row);
        const parsedTransaction = transactionSchema.parse({
          accountId,
          label: row.label || row.description,
          amount: parseDecimal(row.amount),
          type: row.type,
          category: row.category || 'Non classée',
          occurredAt: row.occurred_at || row.date,
          note: row.note || null,
        });
        const { view: _view, ...mapped } = parsedTransaction;
        const key = dedupeKey('transaction', { ...row, accountId, ownerUserId, visibility });
        if (seen.has(key)) continue;
        seen.add(key);
        const occurredAt = normalizeDateInput(mapped.occurredAt);
        const exists = await prisma.transaction.findFirst({ where: { householdId: household.id, label: mapped.label, amount: mapped.amount, occurredAt, accountId, visibility, ownerUserId } });
        if (exists) continue;
        preview.push({ ...mapped, visibility, ownerUserId });
        validRows.push({ ...mapped, occurredAt, householdId: household.id, ownerUserId, visibility });
      } catch (error) {
        errors.push({ row: row.__row ?? '?', message: error instanceof Error ? error.message : 'Ligne invalide' });
      }
    }
    if (!parsed.dryRun && validRows.length > 0) {
      const result = await prisma.transaction.createMany({ data: validRows });
      inserted = result.count;
      const transactions = await prisma.transaction.findMany({ where: buildViewWhere('household', userId, household.id), include: { ownerUser: true }, orderBy: { createdAt: 'desc' }, take: Math.min(inserted, 5) });
      return { inserted, errors, preview: transactions.map(serializeTransaction), pipeline: `${parsed.format}/manual-upload/v2` };
    }
  }

  return { inserted, errors, preview: preview.slice(0, 5), pipeline: `${parsed.format}/manual-upload/v2` };
}
