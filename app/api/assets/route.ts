import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { assetSchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const assets = await prisma.asset.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(assets.map((asset) => ({ ...asset, value: asset.value.toNumber(), costBasis: asset.costBasis?.toNumber() ?? null, performancePct: asset.performancePct?.toNumber() ?? null })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = assetSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const asset = await prisma.asset.create({ data: { ...parsed.data, userId: session.user.id } });
  return NextResponse.json({ ...asset, value: asset.value.toNumber(), costBasis: asset.costBasis?.toNumber() ?? null, performancePct: asset.performancePct?.toNumber() ?? null }, { status: 201 });
}
