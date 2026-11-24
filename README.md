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

Le projet fonctionne **uniquement en local** (aucun Docker). Un script démarre
PostgreSQL, le backend et le frontend en une seule commande :

```bash
./dev.sh
```

- Frontend : <http://127.0.0.1:5173>
- API : <http://127.0.0.1:8000/api/>
- Swagger : <http://127.0.0.1:8000/api/docs/>

Le script utilise le PostgreSQL déjà démarré sur `127.0.0.1:5432` s'il est
accessible ; sinon il initialise et démarre un cluster local dans
`backend/.pgdata`. La base `Fongo_gestion_db` et son rôle sont créés
automatiquement si besoin.
`Ctrl+C` arrête le backend et le frontend ; PostgreSQL reste démarré.

La configuration de la base peut être surchargée par variables d'environnement
(voir `backend/Fongo_Gestion/settings.py`) :

| Variable      | Valeur par défaut | Description                          |
| ------------- | ----------------- | ------------------------------------ |
| `DB_NAME`     | `Fongo_gestion_db`| Nom de la base                        |
| `DB_USER`     | `postgres`        | Utilisateur PostgreSQL                |
| `DB_PASSWORD` | `josue@esanga1`   | Mot de passe                          |
| `DB_HOST`     | `127.0.0.1`       | Hôte                                  |
| `DB_PORT`     | `5432`            | Port                                  |
| `PGDATA`      | `backend/.pgdata` | Cluster local utilisé en secours      |
| `DJANGO_TIME_ZONE` | `Africa/Bujumbura` | Fuseau horaire Django             |

### Démarrage manuel

**1. PostgreSQL** (une seule fois)

```bash
# Variante cluster local au projet
cd backend
/usr/lib/postgresql/*/bin/initdb -D .pgdata -U postgres --auth-local=trust --auth-host=trust
mkdir -p /tmp/fongo-pg
/usr/lib/postgresql/*/bin/pg_ctl -D .pgdata -l .pgdata/postgres.log \
  -o "-p 5432 -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp/fongo-pg" start
psql -h 127.0.0.1 -U postgres -d postgres -c "CREATE DATABASE Fongo_gestion_db OWNER postgres;"
```

**2. Backend**

```bash
cd backend
source env/bin/activate
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Installation complète : [`backend/README.md`](backend/README.md) et
[`frontend/README.md`](frontend/README.md).

## Fonctionnalités

- Authentification JWT avec rôles `super_admin`, `admin`, `stagiaire`, plus des
  rôles supplémentaires d'admin (`formateur`, `caissier`).
- Tableau de bord et statistiques.
- Gestion des membres (CRUD, filtres, recherche, photo).
- Gestion financière : paiements, historique, **graphique d'évolution des
  recettes** (barres mensuelles, montant + nombre de versements), stagiaires,
  rapport cumulatif.
- Devoirs (consignes **et pièce jointe** : PDF, Word ou image), planning,
  annonces, formateurs et modules (avec les logos des langages : HTML5, CSS3,
  JavaScript, Python, Django…).
- Annonces affichées **sur la page d'accueil sans connexion** (endpoint public
  `GET /api/annonces/public/`, les annonces réservées aux administrateurs en
  sont exclues) et **partage image + lien** : depuis la page des annonces comme
  depuis la page d'accueil, chacun peut envoyer l'annonce sur **WhatsApp**
  (statut ou contacts) ou **Facebook**.
  - **L'image est une capture du rendu publié** (`html-to-image` sur la carte
    affichée, déposée en `POST /api/annonces/<id>/poster/`) : elle est donc
    strictement identique au rendu posté, ni retouchée ni recadrée. Elle sert
    de fichier téléchargé (« Télécharger l'image »), d'image du partage et
    d'aperçu du lien — et elle est **re-déposée à chaque partage**, ce qui
    répare automatiquement les images publiées avant la correction de la barre
    de boutons.
  - **Le lien pointe vers la page publique `/a/<id>/`** (template Django avec
    balises Open Graph : WhatsApp et Facebook y affichent image + titre). Les
    visiteurs y voient **l'affiche de l'annonce** (recto/verso du modèle
    FongoExpo, image des annonces visuelles), la capture du rendu lui servant
    de visuel et d'aperçu à défaut ; la page comporte un bouton « Ouvrir le
    dashboard ».
  - Sur mobile, l'API Web Share envoie **l'image et le lien ensemble** ; sans
    partage natif, la plateforme s'ouvre directement avec le lien — aucun
    téléchargement manuel n'est demandé.
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
| Admin + `formateur` | lecture | lecture | **CRUD** | noms + % | CRUD |
| Admin + `caissier` | lecture | lecture | lecture | **CRUD** | CRUD |
| Admin sans rôle supplémentaire | lecture | lecture | lecture | noms + % | CRUD |
| Stagiaire | masqué | lecture | lecture | ses propres versements | scan + son statut |

Rôles supplémentaires (champ `roles_supplementaires`, attribués par le super
admin depuis l'écran « Membres ») :

- **admin** → `formateur` (devoirs), `caissier` (finance), `communication`
  (annonces) ;
- **stagiaire** → `frontend` ou `backend` : ces rôles déterminent les devoirs
  visibles. À la création d'un devoir, on choisit son public (**Tous les
  stagiaires**, **Frontend** ou **Backend**) ; un devoir ciblé « backend »
  n'apparaît que chez les stagiaires dont le rôle supplémentaire est
  `backend` (et réciproquement pour `frontend`), le filtrage étant appliqué
  côté serveur (API et compteur du tableau de bord).

Côté interface :

- les menus **Membres**, **Planning**, **Formateurs**, **Modules** et
  **Présences** sont visibles par tous les utilisateurs sauf les stagiaires
  (lecture seule pour les admins, CRUD réservé au super admin, sauf la
  gestion des présences qui reste opérationnelle pour tous) ;
- le menu **Finance** s'affiche pour les caissiers, les stagiaires, tous les
  admins et le super admin ; un admin non caissier y accède en **lecture
  restreinte** : il ne voit que le **nom** des stagiaires et le **pourcentage**
  de la formation réglé (onglet unique, sans montants, sans statistiques ni
  gestion des paiements). L'endpoint dédié `GET /api/finance/progress/` ne
  renvoie aucun montant, et les autres endpoints finance (`paiements/`,
  `students/`, `overview/`, `stats/`, `dashboard/`) se limitent aux propres
  versements de l'utilisateur dès qu'il n'est pas caissier ;
- le menu **Audit** (journal d'activité) n'apparaît que pour le **super
  admin** : il trace automatiquement qui a fait quoi dans toute l'application
  (créations, modifications, suppressions, connexions, changements de mot de
  passe) avec la date, l'auteur, les champs modifiés (avant → après), l'adresse
  IP et l'appareil. L'API `GET /api/audit/logs/` (filtres `action`,
  `model_label`, `search`) et `GET /api/audit/summary/` (totaux, activité des
  14 derniers jours, comptes les plus actifs) sont protégées par la même
  règle côté serveur ; le journal est conservé sans purge et reste consultable
  en lecture seule dans l'admin Django ;
- sur un **devoir**, l'auteur (formateur ou super admin) peut joindre un
  document en plus des consignes écrites : **PDF, Word (.doc / .docx) ou
  image** (jpg, png, webp, gif), **10 Mo** maximum. Le fichier est validé
  côté serveur (extension + poids, `devoir/serializers.py`), stocké sur
  Supabase Storage (ou en local hors production) et présenté aux stagiaires
  avec un aperçu et un bouton « Ouvrir le document » ; il peut être remplacé
  ou retiré depuis le formulaire d'édition (`file`, `file_name`, `file_size`,
  `file_clear` sur `GET|POST|PATCH /api/devoirs/`) ;
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

Vite redirige `/api`, `/media` et `/static` vers `http://127.0.0.1:8000`
(voir `frontend/vite.config.ts`). Aucune configuration supplémentaire n'est
nécessaire : l'application est prévue pour tourner en local.

## Prérequis

- Python 3.12+
- Node.js 20+
- PostgreSQL (binaires installés ; la base locale du projet est gérée par
  `dev.sh`, aucune configuration système n'est nécessaire)

## Déploiement

Base de données sur **Supabase**, backend et frontend sur **Vercel** :
le guide complet (connexion, transfert des données, variables
d'environnement, pièges courants) est dans [`DEPLOY.md`](DEPLOY.md).

Trois outils sont fournis pour les étapes sensibles :

```bash
cd backend

# Diagnostique étape par étape une connexion (DNS, TCP, SSL, authentification)
python scripts/check_db.py --url "postgresql://postgres.<ref>:<mdp>@…:5432/postgres?sslmode=require"

# Transfère la base locale vers Supabase (dump SQL portable, vérifié après)
./scripts/migrate_to_supabase.sh "postgresql://…"

# Transfère les images (avatars, annonces, modules) vers Supabase Storage
python scripts/upload_media.py
```
