import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assetUpdateSchema } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeAsset } from '@/lib/serializers';
import { getActiveHousehold, resolveOwnerAndVisibility } from '@/lib/household';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const household = await getActiveHousehold(userId);
    const { id } = await params;
    const parsed = assetUpdateSchema.parse(await request.json());
    const existing = await prisma.asset.findFirst({ where: { id, householdId: household.id } });
    if (!existing) return jsonError('Actif introuvable', 404);

    const { view, ...data } = parsed;
    const scope = data.visibility === 'SHARED' ? { ownerUserId: null, visibility: 'SHARED' as const } : view ? resolveOwnerAndVisibility(view, userId) : {};
    const updated = await prisma.asset.update({ where: { id }, data: { ...data, ...scope }, include: { ownerUser: true } });
    return NextResponse.json(serializeAsset(updated));
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
    const existing = await prisma.asset.findFirst({ where: { id, householdId: household.id } });
    if (!existing) return jsonError('Actif introuvable', 404);

    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
