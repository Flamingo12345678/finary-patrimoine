# Finary Patrimoine

MVP web moderne de suivi patrimonial inspiré des usages wealth-tech, avec backend réel, authentification et persistance Prisma.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- Auth.js / NextAuth v5 (Credentials)
- PostgreSQL visé en production, SQLite accepté pour le dev local

## Ce qui a été ajouté

- Authentification crédible avec Auth.js et sessions persistées en base
- Schéma Prisma complet pour `User`, `AuthAccount`, `Session`, `VerificationToken`, `Account`, `Asset`, `Transaction`, `Goal`
- Seed de démonstration avec un utilisateur et des données patrimoniales
- Routes API App Router sécurisées:
  - `GET/POST /api/accounts`
  - `GET/POST /api/assets`
  - `GET/POST /api/transactions`
  - `GET/POST /api/goals`
  - `GET /api/dashboard`
- Dashboard alimenté par l'API au lieu de mocks statiques
- Page de login réelle via Auth.js credentials
- Documentation de setup dev et de bascule vers PostgreSQL

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
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="change-me"
AUTH_URL="http://localhost:3000"
```

### PostgreSQL (cible production)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finary_patrimoine?schema=public"
AUTH_SECRET="change-me"
AUTH_URL="http://localhost:3000"
```

Pour basculer proprement sur PostgreSQL, utiliser le schéma dédié fourni dans le repo:

```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
npm run db:generate:pg
npm run db:push:pg
npm run db:seed
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

## Notes d'implémentation

- En local, SQLite est utilisé par défaut pour éviter de bloquer si PostgreSQL n'est pas dispo sur la machine.
- Le schéma Prisma reste compatible PostgreSQL et c'est la cible recommandée pour un environnement sérieux.
- L'auth actuelle est volontairement simple et pragmatique: provider credentials + hash bcrypt + session DB. C'est solide pour un MVP, mais pas encore du niveau produit final bancaire.

## Prochaines étapes recommandées

- Ajout des `PATCH/DELETE` sur les endpoints
- Gestion fine des catégories, devises et multi-utilisateur admin
- Import bancaire / synchronisation externe
- 2FA, reset password, onboarding et audit logs

## Artefacts BMAD

- `docs/bmad/brief.md`
- `docs/bmad/prd.md`
- `docs/bmad/architecture.md`
- `docs/bmad/ux.md`
