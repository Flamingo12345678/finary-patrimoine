import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeTransaction } from '@/lib/serializers';
import { normalizeDateInput, transactionUpdateSchema } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const { id } = await params;
    const parsed = transactionUpdateSchema.parse(await request.json());
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return jsonError('Transaction introuvable', 404);

    const updated = await prisma.transaction.update({
      where: { id },
      data: { ...parsed, occurredAt: parsed.occurredAt ? normalizeDateInput(parsed.occurredAt) : undefined },
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
    const { id } = await params;
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return jsonError('Transaction introuvable', 404);

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
