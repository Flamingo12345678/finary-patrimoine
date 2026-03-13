export type ImportEntity = 'accounts' | 'assets' | 'transactions';

export const csvTemplates: Record<ImportEntity, string> = {
  accounts: 'name,institution,type,balance,currency\nCompte courant,Banque Horizon,CHECKING,12540,EUR',
  assets: 'name,category,value,cost_basis,performance_pct,account\nETF Monde,EQUITY,38800,36000,7.6,PEA long terme',
  transactions: 'label,amount,type,category,date,account,note\nDividendes,126,INCOME,Revenu,2026-03-02,PEA long terme,Paiement trimestriel',
};

export const importGuides: Record<ImportEntity, {
  title: string;
  description: string;
  acceptedHeaders: string[];
  tips: string[];
}> = {
  transactions: {
    title: 'Transactions',
    description: 'Pour reconstruire l’historique de flux, les catégories et les revenus/dépenses.',
    acceptedHeaders: ['label', 'amount', 'type', 'category', 'date', 'account', 'note'],
    tips: [
      'Utilisez des montants positifs ou négatifs cohérents avec votre export source.',
      'Les dates ISO YYYY-MM-DD sont les plus fiables.',
      'Le compte est optionnel mais recommandé pour relier le mouvement.',
    ],
  },
  accounts: {
    title: 'Comptes',
    description: 'Pour initialiser les soldes bancaires, épargne ou crédit en une fois.',
    acceptedHeaders: ['name', 'institution', 'type', 'balance', 'currency'],
    tips: [
      'Types acceptés : CHECKING, SAVINGS, INVESTMENT, RETIREMENT, CREDIT.',
      'Conservez EUR si vous ne gérez pas encore les multi-devises.',
      'Un compte bien nommé facilitera ensuite le rattachement des actifs et transactions.',
    ],
  },
  assets: {
    title: 'Actifs',
    description: 'Pour importer portefeuille titres, crypto, immobilier ou cash d’investissement.',
    acceptedHeaders: ['name', 'category', 'value', 'cost_basis', 'performance_pct', 'account'],
    tips: [
      'Catégories acceptées : CASH, EQUITY, BOND, REAL_ESTATE, CRYPTO, OTHER.',
      'account doit correspondre exactement au nom d’un compte existant pour être relié.',
      'Vous pouvez laisser cost_basis et performance_pct vides.',
    ],
  },
};
