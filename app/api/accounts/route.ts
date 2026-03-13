import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { accountSchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.account.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(accounts.map((account) => ({ ...account, balance: account.balance.toNumber() })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = accountSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const account = await prisma.account.create({ data: { ...parsed.data, userId: session.user.id } });
  return NextResponse.json({ ...account, balance: account.balance.toNumber() }, { status: 201 });
}
