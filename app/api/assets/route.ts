import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assetSchema } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeAsset } from '@/lib/serializers';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  const assets = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(assets.map(serializeAsset));
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const parsed = assetSchema.parse(await request.json());
    const asset = await prisma.asset.create({ data: { ...parsed, userId } });
    return NextResponse.json(serializeAsset(asset), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
