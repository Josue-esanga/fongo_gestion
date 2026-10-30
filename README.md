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

- Authentification JWT avec rôles `super_admin`, `admin`, `stagiaire`, plus des
  rôles supplémentaires d'admin (`formateur`, `caissier`).
- Tableau de bord et statistiques.
- Gestion des membres (CRUD, filtres, recherche, photo).
- Gestion financière : paiements, stagiaires, rapport cumulatif.
- Devoirs, planning, annonces, formateurs et modules.
- Présences / absences par QR code (`/api/presence/…`).
- Paramètres du compte : profil et mot de passe.
- Documentation OpenAPI interactive.

## Droits d'accès

Règles appliquées par `Fongo_Gestion/permissions.py` :

| Profil | `PATCH /api/users` · `PATCH /api/planning` · `PATCH /api/formation/formateurs` · `POST /api/formation/programme` | Lecture `/api/users`, `/api/planning`, `/api/formation/*`, `/api/formation/programme` | `POST /api/devoirs` | `POST /api/finance/paiements` |
| --- | --- | --- | --- | --- |
| Super admin | ✔ | ✔ | ✔ | ✔ |
| Admin + `formateur` | ✘ | ✔ | ✔ | ✘ |
| Admin + `caissier` | ✘ | ✔ | ✘ | ✔ |
| Admin sans rôle supplémentaire | ✘ | ✔ | ✘ | ✘ |
| Stagiaire | ✘ | ✘ (annuaire et modules) | ✘ | ✘ |

- Seul le super admin écrit les membres (`/api/users`), le planning, les
  annonces, les formateurs, les paramètres et les **modules pédagogiques**
  (`/api/formation/programme/`, grille pré-remplie par la migration
  `formation.0004`) ;
- l'annuaire `/api/users/` est accessible à tous sauf aux stagiaires ;
- un stagiaire ne peut modifier que sa photo (`PATCH /api/auth/me/` refuse les
  autres champs), son mot de passe reste modifiable.

### Présences / absences (QR code)

Appareillage de l'application `presence` :

| Endpoint | Qui | Rôle |
| --- | --- | --- |
| `GET /api/presence/seances/` | hors stagiaires | liste des appels (compteurs présents / absents, `date` + `jour_semaine`), filtrable par jour via `?jour=AAAA-MM-JJ` |
| `POST /api/presence/seances/` | hors stagiaires | démarre un appel : génère le QR code (`qr_payload`) et clôture l'appel précédent — refusé le week-end (`400`) |
| `POST /api/presence/seances/{id}/fermer/` | hors stagiaires | clôture l'appel (fin des scans) |
| `DELETE /api/presence/seances/{id}/` | super admin | suppression d'une séance |
| `GET /api/presence/seances/{id}/participants/` | hors stagiaires | feuille d'appel : tous les stagiaires + `present` / `horodatage` |
| `POST /api/presence/scan/` | stagiaires | enregistre **sa propre** présence à partir du code QR scanné (`FONGO-PRESENCE:<code>` ou code seul) — refusé le week-end (`400`) |
| `GET /api/presence/ma-presence/` | stagiaires | statut du jour : `present`, `horodatage`, `appel_ouvert` (faux le week-end) |

Un stagiaire non scanné ressort **absent** (aucune ligne `Presence` pour la
séance) ; les scans d'un appel clôturé ou d'un code inconnu renvoient `400`.

**Règle du lundi au vendredi** (`presence/utils.py`) : la formation n'a pas
lieu le week-end — le démarrage d'un appel et les scans y sont refusés avec un
message explicite, même si un appel est resté ouvert depuis le vendredi. La
date des séances est classée via le seam testable `utils.date_du_jour()` et
exposée en `date` + `jour_semaine` pour le classement par jour de l'interface.

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
