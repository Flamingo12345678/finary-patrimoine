---
title: PRD - Finary Patrimoine
status: draft
workflow: create-prd
---

# PRD

## 1. Résumé exécutif
Finary Patrimoine est un MVP de dashboard patrimonial personnel destiné à valider une expérience de consultation claire, élégante et mobile-first pour le suivi d’un patrimoine individuel.

## 2. Objectifs produit
- Rendre la situation patrimoniale lisible immédiatement
- Fournir des blocs de lecture simples: comptes, actifs, flux, objectifs
- Poser une base technique propre pour itérer vite

## 3. User stories clés
- En tant qu’utilisateur, je veux me connecter rapidement à une démo locale pour découvrir le produit sans friction.
- En tant qu’utilisateur, je veux voir mon patrimoine net et sa répartition afin de comprendre où se situe mon capital.
- En tant qu’utilisateur, je veux consulter mes comptes et actifs afin d’identifier mes principales positions.
- En tant qu’utilisateur, je veux suivre mes transactions récentes afin de comprendre mes flux.
- En tant qu’utilisateur, je veux voir mes objectifs et leur progression afin de rester motivé.

## 4. Exigences fonctionnelles
1. Landing page avec proposition de valeur et CTA vers la démo.
2. Auth mock côté client persistée en localStorage.
3. Dashboard avec métriques principales.
4. Section allocation avec barres visuelles.
5. Section comptes avec soldes et établissement.
6. Section actifs avec valorisation et variation.
7. Table transactions récentes.
8. Section objectifs avec barre de progression.
9. Responsive complet.

## 5. Exigences non fonctionnelles
- UI rapide et lisible
- Code TypeScript strict
- Structure simple, facilement extensible
- Pas de dépendance backend pour le MVP
- Accessibilité raisonnable et contrastes corrects

## 6. Hors périmètre
- Auth réelle
- API banking/open finance
- CRUD complet
- Export PDF/CSV
- Notifications, automation, AI insights

## 7. Critères d’acceptation
- `npm run build` passe
- Le dashboard est exploitable sur mobile et desktop
- Toutes les zones demandées par le brief sont visibles dans le MVP
