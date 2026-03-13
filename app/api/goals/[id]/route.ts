import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { goalUpdateSchema, normalizeDateInput } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeGoal } from '@/lib/serializers';
import { getActiveHousehold, resolveOwnerAndVisibility } from '@/lib/household';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const household = await getActiveHousehold(userId);
    const { id } = await params;
    const parsed = goalUpdateSchema.parse(await request.json());
    const existing = await prisma.goal.findFirst({ where: { id, householdId: household.id } });
    if (!existing) return jsonError('Objectif introuvable', 404);

    const { view, ...data } = parsed;
    const scope = data.visibility === 'SHARED' ? { ownerUserId: null, visibility: 'SHARED' as const } : view ? resolveOwnerAndVisibility(view, userId) : {};
    const updated = await prisma.goal.update({ where: { id }, data: { ...data, ...scope, deadline: data.deadline ? normalizeDateInput(data.deadline) : data.deadline }, include: { ownerUser: true } });
    return NextResponse.json(serializeGoal(updated));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const household = await getActiveHousehold(userId);
    const { id } = await params;
    const existing = await prisma.goal.findFirst({ where: { id, householdId: household.id } });
    if (!existing) return jsonError('Objectif introuvable', 404);

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
