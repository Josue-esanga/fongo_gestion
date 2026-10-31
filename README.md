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
- Devoirs, planning, annonces, formateurs et modules (avec les logos des
  langages : HTML5, CSS3, JavaScript, Python, Django…).
- Présences / absences des stagiaires par QR code (appel côté admin, scan
  côté stagiaire).
- Paramètres du compte : profil et mot de passe.
- Documentation OpenAPI interactive.

## Droits d'accès

Le super admin est le seul à pouvoir modifier les membres, le planning, les
annonces, les formateurs, les modules et les paramètres du projet. Un admin ne
reçoit que les rôles supplémentaires que le super admin lui attribue (champ
`roles_supplementaires`, géré depuis l'écran « Membres ») :

| Profil | Membres · Planning · Formateurs · Modules | Annonces · Paramètres | Devoirs | Finance | Présences (appel) |
| --- | --- | --- | --- | --- | --- |
| Super admin | CRUD | CRUD | CRUD | CRUD | CRUD |
| Admin + `formateur` | lecture | lecture | **CRUD** | lecture | CRUD |
| Admin + `caissier` | lecture | lecture | lecture | **CRUD** | CRUD |
| Admin sans rôle supplémentaire | lecture | lecture | lecture | lecture | CRUD |
| Stagiaire | masqué | lecture | lecture | ses propres versements | scan + son statut |

Côté interface :

- les menus **Membres**, **Planning**, **Formateurs**, **Modules** et
  **Présences** sont visibles par tous les utilisateurs sauf les stagiaires
  (lecture seule pour les admins, CRUD réservé au super admin, sauf la
  gestion des présences qui reste opérationnelle pour tous) ;
- le menu **Finance** n'apparaît que pour les caissiers, les stagiaires et le
  super admin ;
- l'écran **Modules** présente la grille pédagogique avec les logos précis des
  langages (Premier module : HTML5 et CSS3 ; Deuxième module : JavaScript ;
  Troisième module : Python, bases de données, programmation orientée objet et
  Django) ;
- l'écran **Présences** : « Démarrer l'appel » génère un QR code affiché en
  salle (un nouveau appel invalide le QR précédent) ; les stagiaires qui le
  scannent depuis la carte « Ma présence » de leur tableau de bord sont marqués
  **présents**, les autres **absents** — la feuille d'appel se met à jour en
  direct ; les séances sont **classées par jour** (puces « Aujourd'hui »,
  « jeudi 29 octobre »…) et, la formation ayant lieu **du lundi au vendredi**,
  aucun appel ne peut être démarré ni scanné le week-end (bandeau explicite) ;
- un stagiaire ne peut modifier que sa **photo** de profil dans l'écran
  Paramètres (le changement de mot de passe reste ouvert à chaque utilisateur).

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
