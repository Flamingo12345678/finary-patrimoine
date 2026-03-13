import { PrismaClient, AccountType, AssetCategory, TransactionType, VisibilityScope } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: 'camille@example.com', name: 'Camille Durand', password: 'demo1234' },
    { email: 'lea@example.com', name: 'Léa Martin', password: 'demo1234' },
  ];

  await prisma.transaction.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.account.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.household.deleteMany();
  await prisma.session.deleteMany();
  await prisma.authAccount.deleteMany();
  await prisma.user.deleteMany({ where: { email: { in: users.map((user) => user.email) } } });

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const [camille, lea] = await Promise.all(
    users.map((user) => prisma.user.create({
      data: { email: user.email, name: user.name, passwordHash },
    })),
  );

  const household = await prisma.household.create({
    data: {
      name: 'Camille & Léa',
      members: {
        create: [
          { userId: camille.id, role: 'owner' },
          { userId: lea.id, role: 'owner' },
        ],
      },
    },
  });

  const accounts = await Promise.all([
    prisma.account.create({ data: { householdId: household.id, ownerUserId: camille.id, visibility: VisibilityScope.PERSONAL, name: 'Compte courant Camille', institution: 'Banque Horizon', balance: 12540, type: AccountType.CHECKING } }),
    prisma.account.create({ data: { householdId: household.id, ownerUserId: camille.id, visibility: VisibilityScope.PERSONAL, name: 'PEA Camille', institution: 'Bourse Directe', balance: 48200, type: AccountType.INVESTMENT } }),
    prisma.account.create({ data: { householdId: household.id, ownerUserId: lea.id, visibility: VisibilityScope.PERSONAL, name: 'Compte courant Léa', institution: 'Crédit Atlantique', balance: 9340, type: AccountType.CHECKING } }),
    prisma.account.create({ data: { householdId: household.id, ownerUserId: null, visibility: VisibilityScope.SHARED, name: 'Compte joint', institution: 'Banque Horizon', balance: 15400, type: AccountType.CHECKING } }),
    prisma.account.create({ data: { householdId: household.id, ownerUserId: null, visibility: VisibilityScope.SHARED, name: 'Assurance-vie foyer', institution: 'Épargne Premium', balance: 52100, type: AccountType.INVESTMENT } }),
  ]);

  const byName = Object.fromEntries(accounts.map((account) => [account.name, account]));

  await prisma.asset.createMany({
    data: [
      { householdId: household.id, ownerUserId: camille.id, accountId: byName['PEA Camille'].id, visibility: VisibilityScope.PERSONAL, name: 'ETF Monde Camille', category: AssetCategory.EQUITY, value: 38800, costBasis: 36000, performancePct: 7.6 },
      { householdId: household.id, ownerUserId: lea.id, accountId: byName['Compte courant Léa'].id, visibility: VisibilityScope.PERSONAL, name: 'Épargne précaution Léa', category: AssetCategory.CASH, value: 6400, costBasis: 6400, performancePct: 1.8 },
      { householdId: household.id, ownerUserId: null, accountId: byName['Assurance-vie foyer'].id, visibility: VisibilityScope.SHARED, name: 'SCPI Europe', category: AssetCategory.REAL_ESTATE, value: 24000, costBasis: 23200, performancePct: 3.1 },
      { householdId: household.id, ownerUserId: null, accountId: byName['Assurance-vie foyer'].id, visibility: VisibilityScope.SHARED, name: 'Fonds euros foyer', category: AssetCategory.BOND, value: 19100, costBasis: 18650, performancePct: 2.4 },
      { householdId: household.id, ownerUserId: null, accountId: byName['Compte joint'].id, visibility: VisibilityScope.SHARED, name: 'Trésorerie projet maison', category: AssetCategory.CASH, value: 22340, costBasis: 22340, performancePct: 0.4 },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      { householdId: household.id, ownerUserId: camille.id, accountId: byName['Compte courant Camille'].id, visibility: VisibilityScope.PERSONAL, label: 'Salaire Camille', amount: 3200, type: TransactionType.INCOME, category: 'Salaire', occurredAt: new Date('2026-03-01') },
      { householdId: household.id, ownerUserId: lea.id, accountId: byName['Compte courant Léa'].id, visibility: VisibilityScope.PERSONAL, label: 'Salaire Léa', amount: 2800, type: TransactionType.INCOME, category: 'Salaire', occurredAt: new Date('2026-03-02') },
      { householdId: household.id, ownerUserId: null, accountId: byName['Compte joint'].id, visibility: VisibilityScope.SHARED, label: 'Courses foyer', amount: -142, type: TransactionType.EXPENSE, category: 'Vie courante', occurredAt: new Date('2026-03-03') },
      { householdId: household.id, ownerUserId: null, accountId: byName['Compte joint'].id, visibility: VisibilityScope.SHARED, label: 'Virement épargne maison', amount: 1200, type: TransactionType.TRANSFER, category: 'Épargne', occurredAt: new Date('2026-03-04') },
      { householdId: household.id, ownerUserId: camille.id, accountId: byName['PEA Camille'].id, visibility: VisibilityScope.PERSONAL, label: 'Dividendes', amount: 126, type: TransactionType.INCOME, category: 'Revenu', occurredAt: new Date('2026-03-05') },
    ],
  });

  await prisma.goal.createMany({
    data: [
      { householdId: household.id, ownerUserId: camille.id, visibility: VisibilityScope.PERSONAL, name: 'PEA Camille 60k', target: 60000, current: 48200, deadline: new Date('2027-12-31') },
      { householdId: household.id, ownerUserId: lea.id, visibility: VisibilityScope.PERSONAL, name: 'Coussin Léa', target: 15000, current: 9340, deadline: new Date('2026-10-31') },
      { householdId: household.id, ownerUserId: null, visibility: VisibilityScope.SHARED, name: 'Apport résidence principale', target: 90000, current: 37740, deadline: new Date('2028-06-30') },
    ],
  });

  console.log('Seed terminé pour camille@example.com / demo1234 et lea@example.com / demo1234');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
