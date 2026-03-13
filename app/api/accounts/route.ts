import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { accountSchema, viewModes } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeAccount } from '@/lib/serializers';
import { buildViewWhere, getActiveHousehold, resolveOwnerAndVisibility } from '@/lib/household';

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const viewParam = searchParams.get('view');
  const view = viewModes.includes(viewParam as (typeof viewModes)[number]) ? (viewParam as (typeof viewModes)[number]) : 'household';
  const household = await getActiveHousehold(userId);
  const accounts = await prisma.account.findMany({ where: buildViewWhere(view, userId, household.id), include: { ownerUser: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(accounts.map(serializeAccount));
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const household = await getActiveHousehold(userId);
    const parsed = accountSchema.parse(await request.json());
    const scope = parsed.visibility === 'SHARED' ? { ownerUserId: null, visibility: 'SHARED' as const } : resolveOwnerAndVisibility(parsed.view ?? 'me', userId);
    const account = await prisma.account.create({ data: { name: parsed.name, institution: parsed.institution, type: parsed.type, balance: parsed.balance, currency: parsed.currency, householdId: household.id, ...scope }, include: { ownerUser: true } });
    return NextResponse.json(serializeAccount(account), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
