export type Account = { name: string; institution: string; balance: number; type: string };
export type Asset = { name: string; category: string; value: number; change: number };
export type Transaction = { id: string; label: string; date: string; amount: number; category: string };
export type Goal = { name: string; target: number; current: number; deadline: string };

export const mockUser = {
  name: 'Camille Durand',
  email: 'camille@example.com',
};

export const accounts: Account[] = [
  { name: 'Compte courant', institution: 'Banque Horizon', balance: 12540, type: 'Cash' },
  { name: 'PEA long terme', institution: 'Bourse Directe', balance: 48200, type: 'Investissement' },
  { name: 'Assurance-vie', institution: 'Épargne Premium', balance: 72100, type: 'Investissement' },
  { name: 'Livret A', institution: 'Banque Horizon', balance: 9800, type: 'Épargne' },
];

export const assets: Asset[] = [
  { name: 'ETF Monde', category: 'Actions', value: 38800, change: 7.6 },
  { name: 'SCPI Europe', category: 'Immobilier papier', value: 24000, change: 3.1 },
  { name: 'Fonds euros', category: 'Sécurisé', value: 19100, change: 2.4 },
  { name: 'Cash', category: 'Liquidités', value: 22340, change: 0.4 },
  { name: 'Crypto panier', category: 'Alternatif', value: 8400, change: 12.2 },
];

export const allocation = [
  { label: 'Actions', value: 43 },
  { label: 'Immobilier', value: 22 },
  { label: 'Liquidités', value: 18 },
  { label: 'Sécurisé', value: 12 },
  { label: 'Alternatif', value: 5 },
];

export const transactions: Transaction[] = [
  { id: 't1', label: 'Virement épargne', date: '2026-03-01', amount: 1200, category: 'Épargne' },
  { id: 't2', label: 'Achat ETF Monde', date: '2026-02-26', amount: -800, category: 'Investissement' },
  { id: 't3', label: 'Dividendes', date: '2026-02-20', amount: 126, category: 'Revenu' },
  { id: 't4', label: 'Prime annuelle', date: '2026-02-15', amount: 2200, category: 'Salaire' },
];

export const goals: Goal[] = [
  { name: 'Apport résidence principale', target: 80000, current: 42400, deadline: 'Déc. 2027' },
  { name: 'Indépendance financière', target: 450000, current: 152640, deadline: '2032' },
  { name: 'Coussin de sécurité', target: 20000, current: 12540, deadline: 'Août 2026' },
];

export const totalNetWorth = accounts.reduce((sum, a) => sum + a.balance, 0) + 10000;
