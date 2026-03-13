# Finary Patrimoine

Webapp de suivi patrimonial premium pour usage personnel **et couple/foyer** : comptes perso, actifs partagés, objectifs communs, import multi-format et dashboard consolidé.

Repo: https://github.com/Flamingo12345678/finary-patrimoine

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma ORM
- Auth.js / NextAuth v5 (Credentials)
- SQLite en local, PostgreSQL en Docker local
- Vitest + Testing Library

## Ce que le projet couvre maintenant

- authentification email/mot de passe réellement fonctionnelle
- modèle **multi-utilisateur / foyer** avec membres, séparation perso et données partagées
- vues **Moi / Partagé / Foyer** sur le dashboard
- comptes / actifs / transactions / objectifs en **PERSONAL** ou **SHARED**
- CRUD complet compatible avec cette logique
- import **CSV enrichi** + **OFX** + **QIF** pour les transactions
- attribution d’import par `visibility` et `owner_email`
- déduplication simple sur les imports
- seed de démonstration à 2 personnes
- UI plus premium, orientée synthèse patrimoine individuel + commun

## Démarrage local rapide

```bash
npm install
cp .env.example .env
npm run db:push -- --force-reset
npm run db:seed
npm run dev
```

Puis ouvrir `http://localhost:3000/login`

## Comptes de démo

- Camille: `camille@example.com` / `demo1234`
- Léa: `lea@example.com` / `demo1234`

Les deux comptes appartiennent au même foyer de démonstration **Camille & Léa**.

## Comment tester le mode duo

1. connectez-vous avec `camille@example.com`
2. ouvrez le dashboard puis basculez entre **Moi / Partagé / Foyer**
3. vérifiez que :
   - **Moi** montre uniquement les éléments personnels du compte connecté
   - **Partagé** montre uniquement les éléments communs
   - **Foyer** consolide le perso du compte + le commun
4. créez un compte, actif, objectif ou transaction en **Personnel** puis en **Partagé**
5. déconnectez-vous puis reconnectez-vous avec `lea@example.com`
6. vérifiez que Léa voit :
   - ses propres données en vue **Moi**
   - les mêmes données communes en vue **Partagé**
   - une consolidation différente en vue **Foyer**

## Imports

### Transactions

Formats supportés :
- CSV enrichi
- OFX
- QIF

### CSV enrichi

Exemple transactions :

```csv
label,amount,type,category,date,account,note,visibility,owner_email
Courses,-142.6,EXPENSE,Vie courante,2026-03-03,Compte joint,Supermarché,SHARED,
Dividendes,126,INCOME,Revenu,2026-03-02,PEA Camille,Paiement trimestriel,PERSONAL,camille@example.com
```

Exemple comptes :

```csv
name,institution,type,balance,currency,visibility,owner_email
Compte joint,Banque Horizon,CHECKING,6400,EUR,SHARED,
Compte courant Camille,Banque Horizon,CHECKING,3250,EUR,PERSONAL,camille@example.com
```

Exemple actifs :

```csv
name,category,value,cost_basis,performance_pct,account,visibility,owner_email
Épargne projet maison,CASH,15200,15200,0,Compte joint,SHARED,
ETF Monde,EQUITY,38800,36000,7.6,PEA Camille,PERSONAL,camille@example.com
```

### Logique d’import

- preview avant insertion
- détection simple du séparateur `,` ou `;`
- prise en charge OFX/QIF pour transactions
- liaison au foyer courant
- `visibility=SHARED` => élément commun
- `owner_email` => affectation à un membre du foyer
- déduplication simple sur quelques champs métier

## Variables d'environnement

### Développement SQLite

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me"
AUTH_URL="http://localhost:3000"
```

### Docker local PostgreSQL

```env
POSTGRES_DB=finary_patrimoine
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
APP_PORT=3001
DATABASE_URL=postgresql://postgres:postgres@db:5432/finary_patrimoine?schema=public
AUTH_SECRET=change-me-with-openssl-rand-base64-32
AUTH_URL=http://localhost:3001
PRISMA_SEED_ON_START=true
PRISMA_FORCE_RESET_ON_START=true
```

## Docker Compose local

### Lancement

```bash
cp .env.docker.example .env.docker
# optionnel: générer un vrai secret
openssl rand -base64 32
# remplacer AUTH_SECRET dans .env.docker

docker compose up -d --build
```

Puis ouvrir `http://localhost:3001/login`

### Flux auth disponibles dans Docker

- Camille: `camille@example.com` / `demo1234`
- Léa: `lea@example.com` / `demo1234`
- inscription indépendante: `http://localhost:3001/signup`
- en local Docker, `PRISMA_FORCE_RESET_ON_START=true` force le reset/reseed du PostgreSQL au démarrage pour rester cohérent après évolution de schéma

### Arrêt / reset

```bash
docker compose down
docker compose down -v
```

### Logs utiles

```bash
docker compose logs -f app
docker compose logs -f db
```

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

```bash
npm run lint
npm run test
npm run build
```

## Limites restantes

- un foyer actif par utilisateur (pas encore de switch multi-foyers)
- pas encore de vraie invitation de membre depuis l’UI
- déduplication volontairement simple, sans historique d’import persistant
- parsing OFX/QIF pratique mais pas exhaustif sur tous les exports bancaires
- pas de connecteur bancaire temps réel
