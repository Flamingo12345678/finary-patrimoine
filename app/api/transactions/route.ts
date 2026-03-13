import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const transactions = await prisma.transaction.findMany({ where: { userId: session.user.id }, orderBy: { occurredAt: 'desc' }, take: 50 });
  return NextResponse.json(transactions.map((tx) => ({ ...tx, amount: tx.amount.toNumber() })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = transactionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const transaction = await prisma.transaction.create({ data: { ...parsed.data, occurredAt: new Date(parsed.data.occurredAt), userId: session.user.id } });
  return NextResponse.json({ ...transaction, amount: transaction.amount.toNumber() }, { status: 201 });
}
