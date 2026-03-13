import { prisma } from '@/lib/prisma';

const toNumber = (value: { toNumber(): number } | number | null | undefined) => (typeof value === 'number' ? value : value?.toNumber() ?? 0);

export async function getDashboardData(userId: string) {
  const [accounts, assets, transactions, goals] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { balance: 'desc' } }),
    prisma.asset.findMany({ where: { userId }, orderBy: { value: 'desc' } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { occurredAt: 'desc' }, take: 10 }),
    prisma.goal.findMany({ where: { userId }, orderBy: { deadline: 'asc' } }),
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
    summary: { netWorth, monthlyFlow, accountCount: accounts.length, goalCount: goals.length },
    accounts: accounts.map((account) => ({ ...account, balance: toNumber(account.balance) })),
    assets: assets.map((asset) => ({ ...asset, value: toNumber(asset.value), costBasis: toNumber(asset.costBasis), performancePct: toNumber(asset.performancePct) })),
    transactions: transactions.map((tx) => ({ ...tx, amount: toNumber(tx.amount) })),
    goals: goals.map((goal) => ({ ...goal, target: toNumber(goal.target), current: toNumber(goal.current) })),
    allocation,
  };
}
