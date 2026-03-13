import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeTransaction } from '@/lib/serializers';
import { normalizeDateInput, transactionUpdateSchema } from '@/lib/validation';
import { getActiveHousehold, resolveOwnerAndVisibility } from '@/lib/household';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const household = await getActiveHousehold(userId);
    const { id } = await params;
    const parsed = transactionUpdateSchema.parse(await request.json());
    const existing = await prisma.transaction.findFirst({ where: { id, householdId: household.id } });
    if (!existing) return jsonError('Transaction introuvable', 404);

    const { view, ...data } = parsed;
    const scope = data.visibility === 'SHARED' ? { ownerUserId: null, visibility: 'SHARED' as const } : view ? resolveOwnerAndVisibility(view, userId) : {};
    const updated = await prisma.transaction.update({
      where: { id },
      data: { ...data, ...scope, occurredAt: data.occurredAt ? normalizeDateInput(data.occurredAt) : undefined },
      include: { ownerUser: true },
    });
    return NextResponse.json(serializeTransaction(updated));
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
    const existing = await prisma.transaction.findFirst({ where: { id, householdId: household.id } });
    if (!existing) return jsonError('Transaction introuvable', 404);

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
