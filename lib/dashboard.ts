import { prisma } from '@/lib/prisma';
import { serializeAccount, serializeAsset, serializeGoal, serializeTransaction, toNumber } from '@/lib/serializers';

export async function getDashboardData(userId: string) {
  const [accounts, assets, transactions, goals] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { balance: 'desc' } }),
    prisma.asset.findMany({ where: { userId }, orderBy: { value: 'desc' } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { occurredAt: 'desc' }, take: 10 }),
    prisma.goal.findMany({ where: { userId }, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }] }),
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

  return {
    summary: {
      netWorth,
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
