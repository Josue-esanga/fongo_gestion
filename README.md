# FongoGestion

Plateforme de gestion du club **FongoLab** : stagiaires, finances, devoirs,
planning, annonces et formateurs.

Le projet est séparé en deux dossiers indépendants :

```
projet/
├── backend/    # API REST Django + Django REST Framework
└── frontend/   # Interface React + TypeScript + Vite + PrimeReact
```

## Démarrage rapide

### 1. Backend

```bash
cd backend
source .venv/bin/activate
python manage.py runserver 127.0.0.1:8000
```

API : <http://127.0.0.1:8000/api/>
Swagger : <http://127.0.0.1:8000/api/docs/>

Installation complète : [`backend/README.md`](backend/README.md)

### 2. Frontend

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

Application : <http://127.0.0.1:5173>

Installation complète : [`frontend/README.md`](frontend/README.md)

## Fonctionnalités

- Authentification JWT avec rôles `super_admin`, `admin`, `stagiaire`.
- Tableau de bord et statistiques.
- Gestion des membres (CRUD, filtres, recherche, photo).
- Gestion financière : paiements, stagiaires, rapport cumulatif.
- Devoirs, planning, annonces, formateurs et modules.
- Paramètres du compte : profil et mot de passe.
- Documentation OpenAPI interactive.

## Communication frontend ↔ backend

En développement, Vite redirige `/api`, `/media` et `/static` vers
`http://127.0.0.1:8000` (voir `frontend/vite.config.ts`). Aucune configuration
supplémentaire n'est nécessaire.

En production, buildez le frontend (`npm run build`) et servez `frontend/dist`
via un serveur statique, en définissant `VITE_API_URL` vers l'API déployée.

## Prérequis

- Python 3.12+
- Node.js 20+
- PostgreSQL (configuration dans `backend/Fongo_Gestion/settings.py`)
