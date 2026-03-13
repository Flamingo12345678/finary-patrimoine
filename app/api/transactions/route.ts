import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeTransaction } from '@/lib/serializers';
import { normalizeDateInput, transactionSchema } from '@/lib/validation';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  const transactions = await prisma.transaction.findMany({ where: { userId }, orderBy: { occurredAt: 'desc' }, take: 50 });
  return NextResponse.json(transactions.map(serializeTransaction));
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const parsed = transactionSchema.parse(await request.json());
    const transaction = await prisma.transaction.create({ data: { ...parsed, occurredAt: normalizeDateInput(parsed.occurredAt), userId } });
    return NextResponse.json(serializeTransaction(transaction), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
