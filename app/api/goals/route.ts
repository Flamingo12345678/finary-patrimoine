import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { goalSchema, normalizeDateInput } from '@/lib/validation';
import { handleApiError, jsonError, requireUserId } from '@/lib/http';
import { serializeGoal } from '@/lib/serializers';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError('Unauthorized', 401);

  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { deadline: 'asc' } });
  return NextResponse.json(goals.map(serializeGoal));
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError('Unauthorized', 401);

    const parsed = goalSchema.parse(await request.json());
    const goal = await prisma.goal.create({ data: { ...parsed, deadline: parsed.deadline ? normalizeDateInput(parsed.deadline) : null, userId } });
    return NextResponse.json(serializeGoal(goal), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
