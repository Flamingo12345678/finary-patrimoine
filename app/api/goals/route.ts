import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { goalSchema, normalizeDateInput, viewModes } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeGoal } from '@/lib/serializers';
import { buildViewWhere, getActiveHousehold, resolveOwnerAndVisibility } from '@/lib/household';

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const viewParam = searchParams.get('view');
  const view = viewModes.includes(viewParam as (typeof viewModes)[number]) ? (viewParam as (typeof viewModes)[number]) : 'household';
  const household = await getActiveHousehold(userId);
  const goals = await prisma.goal.findMany({ where: buildViewWhere(view, userId, household.id), include: { ownerUser: true }, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }] });
  return NextResponse.json(goals.map(serializeGoal));
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const household = await getActiveHousehold(userId);
    const parsed = goalSchema.parse(await request.json());
    const scope = parsed.visibility === 'SHARED' ? { ownerUserId: null, visibility: 'SHARED' as const } : resolveOwnerAndVisibility(parsed.view ?? 'me', userId);
    const goal = await prisma.goal.create({ data: { name: parsed.name, target: parsed.target, current: parsed.current, deadline: parsed.deadline ? normalizeDateInput(parsed.deadline) : null, householdId: household.id, ...scope }, include: { ownerUser: true } });
    return NextResponse.json(serializeGoal(goal), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
