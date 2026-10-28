# FongoGestion — Frontend

Interface React + TypeScript de la plateforme de gestion **FongoGestion**.
Elle consomme l'API Django REST Framework du dossier voisin `../backend`.

## Stack

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS v4** (design system, palette bleu nuit `#03045e`)
- **PrimeReact 10** + PrimeIcons (composants professionnels)
- **React Router 7** (routage et gardes de rôles)
- **TanStack Query 5** (cache et requêtes API)
- **Axios** (client HTTP + refresh JWT automatique)
- **React Hook Form** + **Zod** (formulaires et validation)
- **dayjs** (dates en français)

## Prérequis

- Node.js 20+
- Le backend Django lancé sur `http://127.0.0.1:8000`

## Installation

```bash
cd frontend
npm install
cp .env.example .env   # optionnel en développement
npm run dev
```

L'application est disponible sur **http://127.0.0.1:5173**.

## Scripts

| Commande          | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Serveur de développement Vite (HMR)          |
| `npm run build`   | Vérification TypeScript + build de production |
| `npm run preview` | Prévisualisation du build                    |
| `npm run lint`    | Analyse statique avec Oxlint                 |

## Configuration

| Variable        | Défaut | Description                                                        |
| --------------- | ------ | ------------------------------------------------------------------ |
| `VITE_API_URL`  | `/api` | URL de base de l'API. Vide = proxy Vite vers Django en dev.        |

Le proxy de développement (`vite.config.ts`) redirige `/api`, `/media` et
`/static` vers `http://127.0.0.1:8000`.

## Authentification

- Connexion via `POST /api/auth/login/` (JWT access + refresh).
- Les tokens sont conservés dans `localStorage`.
- Un intercepteur Axios rafraîchit automatiquement l'access token expiré
  (`POST /api/auth/refresh/`) et déconnecte l'utilisateur si le refresh échoue.
- Les routes sont protégées par rôle (`super_admin`, `admin`, `stagiaire`).

## Organisation

```
src/
├── api/          # client Axios + appels API par domaine
├── components/   # composants partagés (Layout, EmptyState, UserAvatar…)
├── contexts/     # Auth, Toast
├── lib/          # utilitaires (formatage, rôles)
├── pages/        # pages par domaine (dashboard, membres, finance…)
├── types/        # types TypeScript partagés
├── App.tsx       # routes et gardes
└── main.tsx      # providers + styles
```

## Documentation API

Swagger : `http://127.0.0.1:8000/api/docs/`
Redoc : `http://127.0.0.1:8000/api/redoc/`
Schéma OpenAPI : `http://127.0.0.1:8000/api/schema/`
