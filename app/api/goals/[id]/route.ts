import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { goalUpdateSchema, normalizeDateInput } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeGoal } from '@/lib/serializers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const { id } = await params;
    const parsed = goalUpdateSchema.parse(await request.json());
    const existing = await prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) return jsonError('Objectif introuvable', 404);

    const updated = await prisma.goal.update({ where: { id }, data: { ...parsed, deadline: parsed.deadline ? normalizeDateInput(parsed.deadline) : parsed.deadline } });
    return NextResponse.json(serializeGoal(updated));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const { id } = await params;
    const existing = await prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) return jsonError('Objectif introuvable', 404);

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
