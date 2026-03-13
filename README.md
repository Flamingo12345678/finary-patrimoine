# Finary Patrimoine

MVP web de suivi patrimonial inspiré des usages wealth-tech, avec backend réel, authentification, persistance Prisma, CRUD complet, import CSV guidé et pipeline CI/CD pragmatique.

Repo: https://github.com/Flamingo12345678/finary-patrimoine

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma ORM
- Auth.js / NextAuth v5 (Credentials)
- SQLite en local, PostgreSQL visé en production
- Vitest + Testing Library pour les tests
- GitHub Actions pour CI/CD

## Ce que le projet couvre

- dashboard patrimoine moderne
- connexion email/mot de passe réellement fonctionnelle
- création de compte simple avec hash bcrypt
- CRUD comptes / actifs / transactions / objectifs
- import CSV avec preview
- onboarding d’import plus guidé
- validation API avec Zod
- base Prisma + seed de démonstration
- CI PR/push + workflow de déploiement dev/prod

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

### Créer un compte

- UI: `http://localhost:3000/signup`
- endpoint: `POST /api/auth/signup`
- à la création, le mot de passe est validé puis hashé avec bcrypt avant insertion Prisma

## Variables d'environnement

### Développement SQLite

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

## Docker Compose local

Objectif: lancer l’app Next.js avec PostgreSQL local persistant, sans casser le mode SQLite existant hors Docker.

### Lancement

```bash
cp .env.docker.example .env.docker
# optionnel: générer un vrai secret
openssl rand -base64 32
# puis remplacer AUTH_SECRET dans .env.docker

docker compose up -d --build
```

Puis ouvrir `http://localhost:3001/login`

### Flux auth disponibles dans Docker

- connexion démo: `camille@example.com` / `demo1234`
- inscription: `http://localhost:3001/signup`

### Arrêt / reset

```bash
docker compose down
docker compose down -v   # supprime aussi le volume PostgreSQL
```

### Logs utiles

```bash
docker compose logs -f app
docker compose logs -f db
```

### Commandes Prisma dans Docker

```bash
docker compose exec app npx prisma db push --schema prisma/schema.postgresql.prisma
docker compose exec app npm run db:seed
docker compose exec app npx prisma studio --browser none --port 5555
```

### Variables Docker

Fichier: `.env.docker`

- `APP_PORT=3001`
- `POSTGRES_PORT=5432`
- `POSTGRES_DB=finary_patrimoine`
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=postgres`
- `AUTH_URL=http://localhost:3001`
- `AUTH_SECRET=...`
- `PRISMA_SEED_ON_START=true`

### Notes d’implémentation

- hors Docker, le projet reste en SQLite par défaut via `.env`
- en Docker, l’entrypoint applique `prisma db push` sur `prisma/schema.postgresql.prisma`
- le seed de démo est exécuté au démarrage tant que `PRISMA_SEED_ON_START=true`
- les données PostgreSQL sont persistées dans le volume Docker `postgres_data`

## Import CSV guidé

Le dashboard embarque désormais un flux d’onboarding plus propre:

1. choisir le type de données à importer
2. charger ou copier un modèle CSV
3. coller/adapter le contenu
4. lancer une preview avant import réel
5. vérifier les erreurs éventuelles avant persistance

## Scripts utiles

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run check
npm run db:generate
npm run db:push
npm run db:seed
npm run db:generate:pg
npm run db:push:pg
```

## Vérifications réalisées

Les commandes suivantes ont été validées dans ce repo:

```bash
npm run lint
npm run test
npm run build
docker compose up -d --build
```

## Limites actuelles

- pas de connecteur bancaire réel
- pas de déduplication ni d’historique d’import
- pas de multi-devises avancé
- pas de design system complet
- auth encore simple pour un MVP

## Artefacts BMAD

- `docs/bmad/brief.md`
- `docs/bmad/prd.md`
- `docs/bmad/architecture.md`
- `docs/bmad/ux.md`
