import { prisma } from '@/lib/prisma';
import { buildViewWhere, getActiveHousehold, type ViewMode } from '@/lib/household';
import { serializeAccount, serializeAsset, serializeGoal, serializeTransaction, toNumber } from '@/lib/serializers';

export async function getDashboardData(userId: string, view: ViewMode = 'household') {
  const household = await getActiveHousehold(userId);
  const where = buildViewWhere(view, userId, household.id);

  const [accounts, assets, transactions, goals] = await Promise.all([
    prisma.account.findMany({ where, include: { ownerUser: true }, orderBy: { balance: 'desc' } }),
    prisma.asset.findMany({ where, include: { ownerUser: true }, orderBy: { value: 'desc' } }),
    prisma.transaction.findMany({ where, include: { ownerUser: true }, orderBy: { occurredAt: 'desc' }, take: 10 }),
    prisma.goal.findMany({ where, include: { ownerUser: true }, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }] }),
  ]);

  const netWorth = accounts.reduce((sum, account) => sum + toNumber(account.balance), 0) + assets.reduce((sum, asset) => sum + toNumber(asset.value), 0);
  const monthlyFlow = transactions.reduce((sum, tx) => sum + toNumber(tx.amount), 0);
  const totalAssets = assets.reduce((sum, asset) => sum + toNumber(asset.value), 0);

  const allocationMap = assets.reduce<Record<string, number>>((acc, asset) => {
    const label = asset.category;
    acc[label] = (acc[label] ?? 0) + toNumber(asset.value);
    return acc;
  }, {});

  const allocation = Object.entries(allocationMap).map(([label, value]) => ({
    label,
    value: totalAssets === 0 ? 0 : Math.round((value / totalAssets) * 100),
  }));

  const personalNetWorth = accounts.filter((a) => a.visibility === 'PERSONAL' && a.ownerUserId === userId).reduce((sum, account) => sum + toNumber(account.balance), 0)
    + assets.filter((a) => a.visibility === 'PERSONAL' && a.ownerUserId === userId).reduce((sum, asset) => sum + toNumber(asset.value), 0);
  const sharedNetWorth = accounts.filter((a) => a.visibility === 'SHARED').reduce((sum, account) => sum + toNumber(account.balance), 0)
    + assets.filter((a) => a.visibility === 'SHARED').reduce((sum, asset) => sum + toNumber(asset.value), 0);

  return {
    household: {
      id: household.id,
      name: household.name,
      members: household.members.map((member) => ({ id: member.user.id, name: member.user.name, email: member.user.email, role: member.role })),
    },
    view,
    summary: {
      netWorth,
      personalNetWorth,
      sharedNetWorth,
      monthlyFlow,
      accountCount: accounts.length,
      goalCount: goals.length,
      assetCount: assets.length,
      transactionCount: transactions.length,
    },
    accounts: accounts.map(serializeAccount),
    assets: assets.map(serializeAsset),
    transactions: transactions.map(serializeTransaction),
    goals: goals.map(serializeGoal),
    allocation,
  };
}
