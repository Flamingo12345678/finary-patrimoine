import { prisma } from '@/lib/prisma';

export type ViewMode = 'me' | 'shared' | 'household';
export const DEFAULT_VIEW: ViewMode = 'household';

export async function getActiveHousehold(userId: string) {
  const membership = await prisma.householdMember.findFirst({
    where: { userId },
    include: { household: { include: { members: { include: { user: true } } } } },
    orderBy: { createdAt: 'asc' },
  });

  if (!membership) throw new Error('Aucun foyer associé à ce compte.');
  return membership.household;
}

export async function requireHouseholdAccess(userId: string, householdId: string) {
  const membership = await prisma.householdMember.findFirst({ where: { userId, householdId } });
  if (!membership) throw new Error('Accès foyer refusé');
  return membership;
}

export function buildViewWhere(view: ViewMode, userId: string, householdId: string) {
  if (view === 'me') {
    return { householdId, visibility: 'PERSONAL' as const, ownerUserId: userId };
  }

  if (view === 'shared') {
    return { householdId, visibility: 'SHARED' as const };
  }

  return {
    householdId,
    OR: [
      { visibility: 'SHARED' as const },
      { visibility: 'PERSONAL' as const, ownerUserId: userId },
    ],
  };
}

export function resolveOwnerAndVisibility(view: ViewMode, userId: string) {
  if (view === 'shared') return { ownerUserId: null, visibility: 'SHARED' as const };
  return { ownerUserId: userId, visibility: 'PERSONAL' as const };
}
