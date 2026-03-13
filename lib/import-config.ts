export type ImportEntity = 'accounts' | 'assets' | 'transactions';

export const csvTemplates: Record<ImportEntity, string> = {
  accounts: 'name,institution,type,balance,currency,visibility,owner_email\nCompte courant perso,Banque Horizon,CHECKING,3250,EUR,PERSONAL,camille@example.com\nCompte joint,Banque Horizon,CHECKING,6400,EUR,SHARED,',
  assets: 'name,category,value,cost_basis,performance_pct,account,visibility,owner_email\nETF Monde,EQUITY,38800,36000,7.6,PEA Camille,PERSONAL,camille@example.com\nÉpargne projet maison,CASH,15200,15200,0,Compte joint,SHARED,',
  transactions: 'label,amount,type,category,date,account,note,visibility,owner_email\nDividendes,126,INCOME,Revenu,2026-03-02,PEA Camille,Paiement trimestriel,PERSONAL,camille@example.com\nCourses,-142.6,EXPENSE,Vie courante,2026-03-03,Compte joint,Supermarché,SHARED,',
};

export const importGuides: Record<ImportEntity, {
  title: string;
  description: string;
  acceptedHeaders: string[];
  tips: string[];
}> = {
  transactions: {
    title: 'Transactions',
    description: 'Pour reconstruire l’historique de flux, en perso ou en partagé.',
    acceptedHeaders: ['label', 'amount', 'type', 'category', 'date', 'account', 'note', 'visibility', 'owner_email'],
    tips: [
      'Formats pris en charge : CSV, OFX et QIF pour les transactions.',
      'visibility=SHARED crée un mouvement visible au foyer entier.',
      'owner_email permet d’attribuer un mouvement perso à un membre précis du foyer.',
    ],
  },
  accounts: {
    title: 'Comptes',
    description: 'Pour initialiser les soldes bancaires, épargne ou crédit, perso ou commun.',
    acceptedHeaders: ['name', 'institution', 'type', 'balance', 'currency', 'visibility', 'owner_email'],
    tips: [
      'Types acceptés : CHECKING, SAVINGS, INVESTMENT, RETIREMENT, CREDIT.',
      'Un compte SHARED peut ensuite porter actifs et transactions communs.',
      'owner_email est optionnel si visibility=SHARED.',
    ],
  },
  assets: {
    title: 'Actifs',
    description: 'Pour importer portefeuille titres, crypto, immobilier ou cash, en personnel ou foyer.',
    acceptedHeaders: ['name', 'category', 'value', 'cost_basis', 'performance_pct', 'account', 'visibility', 'owner_email'],
    tips: [
      'Catégories acceptées : CASH, EQUITY, BOND, REAL_ESTATE, CRYPTO, OTHER.',
      'account doit correspondre exactement au nom d’un compte existant dans le foyer.',
      'Les imports évitent les doublons évidents sur quelques champs clés.',
    ],
  },
};
