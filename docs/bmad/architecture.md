---
title: Lightweight Architecture - Finary Patrimoine
status: draft
workflow: create-architecture
---

# Architecture légère

## Stack
- Next.js App Router
- TypeScript strict
- Tailwind CSS
- Données mockées locales

## Structure
- `app/` routes et layout
- `components/` composants UI de landing/auth/dashboard
- `lib/data.ts` source de données mockées typées
- `docs/bmad/` artefacts BMAD

## Choix techniques
- SSR/SPA hybride permis par Next.js, mais MVP surtout client-side sur l’espace dashboard à cause de l’auth mock.
- Tailwind pour livrer vite une UI premium et cohérente.
- Données statiques pour valider design et structure avant backend.
- localStorage pour simuler une session sans dépendance externe.

## Évolutions prévues
- Remplacer localStorage par NextAuth/Clerk/Supabase Auth
- Introduire une couche API + persistance
- Ajouter agrégation bancaire et catégorisation réelle
- Ajouter graphiques avancés et historique détaillé
