import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDashboardData } from '@/lib/dashboard';
import { viewModes } from '@/lib/validation';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const viewParam = searchParams.get('view');
  const view = viewModes.includes(viewParam as (typeof viewModes)[number]) ? (viewParam as (typeof viewModes)[number]) : 'household';
  const data = await getDashboardData(session.user.id, view);
  return NextResponse.json(data);
}
