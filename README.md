# Finary Patrimoine

MVP web moderne de suivi patrimonial inspiré des usages wealth-tech, avec backend réel, authentification, persistance Prisma, CRUD complet et import CSV exploitable.

Repo: https://github.com/Flamingo12345678/finary-patrimoine

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- Auth.js / NextAuth v5 (Credentials)
- SQLite en dev local, PostgreSQL visé en production

## Ce qui a été ajouté

### 1) CRUD complet

- Endpoints sécurisés avec validation Zod pour:
  - `GET/POST /api/accounts`
  - `GET/POST /api/assets`
  - `GET/POST /api/transactions`
  - `GET/POST /api/goals`
  - `PATCH/DELETE /api/accounts/:id`
  - `PATCH/DELETE /api/assets/:id`
  - `PATCH/DELETE /api/transactions/:id`
  - `PATCH/DELETE /api/goals/:id`
- UI de création, édition et suppression directement dans le dashboard
- Validation et messages d’erreur propres côté API

### 2) Import / sync patrimonial

- Route `GET/POST /api/import/csv`
- Import CSV pour:
  - comptes
  - actifs
  - transactions
- Parsing robuste sans dépendance lourde:
  - support `,` et `;`
  - gestion simple des guillemets
  - normalisation d’en-têtes
  - mapping de colonnes usuelles
- Preview avant import (`dryRun`) puis persistance en base
- Abstraction légère de pipeline avec identifiant `csv/manual-upload/v1` pour préparer une future intégration connecteur

### 3) Raffinement UI / UX

- Dashboard plus premium avec sidebar, hero, cartes, hiérarchie visuelle et mini bar chart
- Meilleure présentation responsive
- États vides plus propres
- Tableaux/listes remplacés par cartes denses et éditables
- Esthétique moderne finance/patrimoine sans copier branding ni contenu tiers

## Démarrage local

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Puis ouvrir `http://localhost:3000/login`

### Compte de démo

- Email: `camille@example.com`
- Mot de passe: `demo1234`

## Variables d'environnement

### Dev rapide avec SQLite

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me"
AUTH_URL="http://localhost:3000"
```

### PostgreSQL (cible production)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finary_patrimoine?schema=public"
AUTH_SECRET="change-me"
AUTH_URL="http://localhost:3000"
```

Pour basculer vers PostgreSQL:

```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
npm run db:generate:pg
npm run db:push:pg
npm run db:seed
```

## Format CSV attendu

### Comptes

Colonnes recommandées:

```csv
name,institution,type,balance,currency
Compte courant,Banque Horizon,CHECKING,12540,EUR
```

Types acceptés:
- `CHECKING`
- `SAVINGS`
- `INVESTMENT`
- `RETIREMENT`
- `CREDIT`

### Actifs

Colonnes recommandées:

```csv
name,category,value,cost_basis,performance_pct,account
ETF Monde,EQUITY,38800,36000,7.6,PEA long terme
```

Catégories acceptées:
- `CASH`
- `EQUITY`
- `BOND`
- `REAL_ESTATE`
- `CRYPTO`
- `OTHER`

`account` doit correspondre au nom d’un compte existant si vous voulez rattacher l’actif.

### Transactions

Colonnes recommandées:

```csv
label,amount,type,category,date,account,note
Dividendes,126,INCOME,Revenu,2026-03-02,PEA long terme,Paiement trimestriel
```

Types acceptés:
- `INCOME`
- `EXPENSE`
- `TRANSFER`
- `INVESTMENT`

Formats de date recommandés:
- `YYYY-MM-DD`
- ISO datetime

## Tester l’import CSV

### Prévisualiser

```bash
curl -X POST http://localhost:3000/api/import/csv \
  -H 'Content-Type: application/json' \
  -d '{
    "entity":"transactions",
    "dryRun":true,
    "csv":"label,amount,type,category,date,account,note\nDividendes,126,INCOME,Revenu,2026-03-02,PEA long terme,Paiement trimestriel"
  }'
```

### Importer réellement

```bash
curl -X POST http://localhost:3000/api/import/csv \
  -H 'Content-Type: application/json' \
  -d '{
    "entity":"transactions",
    "dryRun":false,
    "csv":"label,amount,type,category,date,account,note\nDividendes,126,INCOME,Revenu,2026-03-02,PEA long terme,Paiement trimestriel"
  }'
```

## Scripts utiles

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:push
npm run db:seed
npm run db:generate:pg
npm run db:push:pg
```

## Notes d’implémentation

- En local, SQLite est utilisé par défaut pour éviter de dépendre d’une infra externe.
- L’auth actuelle reste volontairement simple et pragmatique pour un MVP.
- L’import CSV est un vrai flux utile, mais il ne gère pas encore le dédoublonnage ni la synchro incrémentale.
- Le pipeline a été pensé pour accepter plus tard des connecteurs externes sans recasser les écrans.

## Limites actuelles

- Pas encore de connecteur bancaire réel
- Pas de catégorisation intelligente ni de règles automatiques
- Pas de gestion multi-devises avancée
- Pas de détection de doublons à l’import
- Les visuels sont premium/MVP mais pas encore au niveau d’un design system complet

## Prochaines étapes recommandées

- Déduplication et historique d’import
- Onboarding et mapping interactif colonne par colonne
- Catégories personnalisables
- Audit logs, 2FA, reset password
- Courbes historiques plus riches et suivi de valorisation dans le temps

## Artefacts BMAD

- `docs/bmad/brief.md`
- `docs/bmad/prd.md`
- `docs/bmad/architecture.md`
- `docs/bmad/ux.md`
