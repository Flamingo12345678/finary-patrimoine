import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assetUpdateSchema } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeAsset } from '@/lib/serializers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const { id } = await params;
    const parsed = assetUpdateSchema.parse(await request.json());
    const existing = await prisma.asset.findFirst({ where: { id, userId } });
    if (!existing) return jsonError('Actif introuvable', 404);

    const updated = await prisma.asset.update({ where: { id }, data: parsed });
    return NextResponse.json(serializeAsset(updated));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);
    const { id } = await params;
    const existing = await prisma.asset.findFirst({ where: { id, userId } });
    if (!existing) return jsonError('Actif introuvable', 404);

    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
