import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { accountSchema } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeAccount } from '@/lib/serializers';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(accounts.map(serializeAccount));
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const parsed = accountSchema.parse(await request.json());
    const account = await prisma.account.create({ data: { ...parsed, userId } });
    return NextResponse.json(serializeAccount(account), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
