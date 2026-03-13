import { PrismaClient, AccountType, AssetCategory, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'camille@example.com';
  const passwordHash = await bcrypt.hash('demo1234', 10);

  await prisma.transaction.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.authAccount.deleteMany();
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      name: 'Camille Durand',
      email,
      passwordHash,
      accounts: {
        create: [
          { name: 'Compte courant', institution: 'Banque Horizon', balance: 12540, type: AccountType.CHECKING },
          { name: 'Livret A', institution: 'Banque Horizon', balance: 9800, type: AccountType.SAVINGS },
          { name: 'PEA long terme', institution: 'Bourse Directe', balance: 48200, type: AccountType.INVESTMENT },
          { name: 'Assurance-vie', institution: 'Épargne Premium', balance: 72100, type: AccountType.INVESTMENT },
        ],
      },
      goals: {
        create: [
          { name: 'Apport résidence principale', target: 80000, current: 42400, deadline: new Date('2027-12-31') },
          { name: 'Indépendance financière', target: 450000, current: 152640, deadline: new Date('2032-12-31') },
          { name: 'Coussin de sécurité', target: 20000, current: 12540, deadline: new Date('2026-08-31') },
        ],
      },
    },
    include: { accounts: true },
  });

  const checking = user.accounts.find((account) => account.name === 'Compte courant');
  const pea = user.accounts.find((account) => account.name === 'PEA long terme');
  const lifeInsurance = user.accounts.find((account) => account.name === 'Assurance-vie');

  await prisma.asset.createMany({
    data: [
      { userId: user.id, accountId: pea?.id, name: 'ETF Monde', category: AssetCategory.EQUITY, value: 38800, costBasis: 36000, performancePct: 7.6 },
      { userId: user.id, accountId: lifeInsurance?.id, name: 'SCPI Europe', category: AssetCategory.REAL_ESTATE, value: 24000, costBasis: 23200, performancePct: 3.1 },
      { userId: user.id, accountId: lifeInsurance?.id, name: 'Fonds euros', category: AssetCategory.BOND, value: 19100, costBasis: 18650, performancePct: 2.4 },
      { userId: user.id, accountId: checking?.id, name: 'Cash', category: AssetCategory.CASH, value: 22340, costBasis: 22340, performancePct: 0.4 },
      { userId: user.id, accountId: pea?.id, name: 'Crypto panier', category: AssetCategory.CRYPTO, value: 8400, costBasis: 7480, performancePct: 12.2 },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      { userId: user.id, accountId: checking?.id, label: 'Virement épargne', amount: 1200, type: TransactionType.TRANSFER, category: 'Épargne', occurredAt: new Date('2026-03-01') },
      { userId: user.id, accountId: pea?.id, label: 'Achat ETF Monde', amount: -800, type: TransactionType.INVESTMENT, category: 'Investissement', occurredAt: new Date('2026-02-26') },
      { userId: user.id, accountId: pea?.id, label: 'Dividendes', amount: 126, type: TransactionType.INCOME, category: 'Revenu', occurredAt: new Date('2026-02-20') },
      { userId: user.id, accountId: checking?.id, label: 'Prime annuelle', amount: 2200, type: TransactionType.INCOME, category: 'Salaire', occurredAt: new Date('2026-02-15') },
    ],
  });

  console.log(`Seed terminé pour ${email} / mot de passe demo1234`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
