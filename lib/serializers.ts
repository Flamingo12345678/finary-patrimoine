type Decimalish = { toNumber(): number } | number | null | undefined;

type Ownerish = { id: string; name: string | null; email: string } | null | undefined;

export const toNumber = (value: Decimalish) => (typeof value === 'number' ? value : value?.toNumber() ?? 0);

function serializeOwner(owner: Ownerish) {
  if (!owner) return null;
  return { id: owner.id, name: owner.name, email: owner.email };
}

export function serializeAccount(account: {
  id: string; householdId: string; ownerUserId: string | null; visibility: string; name: string; institution: string; balance: Decimalish; currency: string; type: string; createdAt: Date; updatedAt: Date; ownerUser?: Ownerish;
}) {
  return { ...account, balance: toNumber(account.balance), ownerUser: serializeOwner(account.ownerUser) };
}

export function serializeAsset(asset: {
  id: string; householdId: string; ownerUserId: string | null; accountId: string | null; visibility: string; name: string; category: string; value: Decimalish; costBasis: Decimalish; performancePct: Decimalish; createdAt: Date; updatedAt: Date; ownerUser?: Ownerish;
}) {
  return { ...asset, value: toNumber(asset.value), costBasis: asset.costBasis == null ? null : toNumber(asset.costBasis), performancePct: asset.performancePct == null ? null : toNumber(asset.performancePct), ownerUser: serializeOwner(asset.ownerUser) };
}

export function serializeTransaction(transaction: {
  id: string; householdId: string; ownerUserId: string | null; accountId: string | null; visibility: string; label: string; amount: Decimalish; type: string; category: string; occurredAt: Date; note: string | null; createdAt: Date; updatedAt: Date; ownerUser?: Ownerish;
}) {
  return { ...transaction, amount: toNumber(transaction.amount), ownerUser: serializeOwner(transaction.ownerUser) };
}

export function serializeGoal(goal: {
  id: string; householdId: string; ownerUserId: string | null; visibility: string; name: string; target: Decimalish; current: Decimalish; deadline: Date | null; createdAt: Date; updatedAt: Date; ownerUser?: Ownerish;
}) {
  return { ...goal, target: toNumber(goal.target), current: toNumber(goal.current), ownerUser: serializeOwner(goal.ownerUser) };
}
