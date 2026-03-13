import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeTransaction } from '@/lib/serializers';
import { normalizeDateInput, transactionSchema, viewModes } from '@/lib/validation';
import { buildViewWhere, getActiveHousehold, resolveOwnerAndVisibility } from '@/lib/household';

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const viewParam = searchParams.get('view');
  const view = viewModes.includes(viewParam as (typeof viewModes)[number]) ? (viewParam as (typeof viewModes)[number]) : 'household';
  const household = await getActiveHousehold(userId);
  const transactions = await prisma.transaction.findMany({ where: buildViewWhere(view, userId, household.id), include: { ownerUser: true }, orderBy: { occurredAt: 'desc' }, take: 50 });
  return NextResponse.json(transactions.map(serializeTransaction));
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const household = await getActiveHousehold(userId);
    const parsed = transactionSchema.parse(await request.json());
    const scope = parsed.visibility === 'SHARED' ? { ownerUserId: null, visibility: 'SHARED' as const } : resolveOwnerAndVisibility(parsed.view ?? 'me', userId);
    const transaction = await prisma.transaction.create({ data: { accountId: parsed.accountId, label: parsed.label, amount: parsed.amount, type: parsed.type, category: parsed.category, occurredAt: normalizeDateInput(parsed.occurredAt), note: parsed.note, householdId: household.id, ...scope }, include: { ownerUser: true } });
    return NextResponse.json(serializeTransaction(transaction), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
