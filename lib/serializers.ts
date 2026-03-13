type Decimalish = { toNumber(): number } | number | null | undefined;

export const toNumber = (value: Decimalish) => (typeof value === 'number' ? value : value?.toNumber() ?? 0);

export function serializeAccount(account: {
  id: string; userId: string; name: string; institution: string; balance: Decimalish; currency: string; type: string; createdAt: Date; updatedAt: Date;
}) {
  return { ...account, balance: toNumber(account.balance) };
}

export function serializeAsset(asset: {
  id: string; userId: string; accountId: string | null; name: string; category: string; value: Decimalish; costBasis: Decimalish; performancePct: Decimalish; createdAt: Date; updatedAt: Date;
}) {
  return { ...asset, value: toNumber(asset.value), costBasis: asset.costBasis == null ? null : toNumber(asset.costBasis), performancePct: asset.performancePct == null ? null : toNumber(asset.performancePct) };
}

export function serializeTransaction(transaction: {
  id: string; userId: string; accountId: string | null; label: string; amount: Decimalish; type: string; category: string; occurredAt: Date; note: string | null; createdAt: Date; updatedAt: Date;
}) {
  return { ...transaction, amount: toNumber(transaction.amount) };
}

export function serializeGoal(goal: {
  id: string; userId: string; name: string; target: Decimalish; current: Decimalish; deadline: Date | null; createdAt: Date; updatedAt: Date;
}) {
  return { ...goal, target: toNumber(goal.target), current: toNumber(goal.current) };
}
