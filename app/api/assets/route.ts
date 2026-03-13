import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assetSchema, viewModes } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeAsset } from '@/lib/serializers';
import { buildViewWhere, getActiveHousehold, resolveOwnerAndVisibility } from '@/lib/household';

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const viewParam = searchParams.get('view');
  const view = viewModes.includes(viewParam as (typeof viewModes)[number]) ? (viewParam as (typeof viewModes)[number]) : 'household';
  const household = await getActiveHousehold(userId);
  const assets = await prisma.asset.findMany({ where: buildViewWhere(view, userId, household.id), include: { ownerUser: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(assets.map(serializeAsset));
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const household = await getActiveHousehold(userId);
    const parsed = assetSchema.parse(await request.json());
    const scope = parsed.visibility === 'SHARED' ? { ownerUserId: null, visibility: 'SHARED' as const } : resolveOwnerAndVisibility(parsed.view ?? 'me', userId);
    const asset = await prisma.asset.create({ data: { accountId: parsed.accountId, name: parsed.name, category: parsed.category, value: parsed.value, costBasis: parsed.costBasis, performancePct: parsed.performancePct, householdId: household.id, ...scope }, include: { ownerUser: true } });
    return NextResponse.json(serializeAsset(asset), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
