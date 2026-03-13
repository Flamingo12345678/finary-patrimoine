import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { goalSchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const goals = await prisma.goal.findMany({ where: { userId: session.user.id }, orderBy: { deadline: 'asc' } });
  return NextResponse.json(goals.map((goal) => ({ ...goal, target: goal.target.toNumber(), current: goal.current.toNumber() })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = goalSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const goal = await prisma.goal.create({ data: { ...parsed.data, deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null, userId: session.user.id } });
  return NextResponse.json({ ...goal, target: goal.target.toNumber(), current: goal.current.toNumber() }, { status: 201 });
}
