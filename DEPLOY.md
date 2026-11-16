# Déploiement : Supabase (base de données) + Vercel (backend & frontend)

Cible :

| Service | Rôle | Exemple d'URL |
|---|---|---|
| **Supabase** | PostgreSQL managé (données) | `aws-0-<region>.pooler.supabase.com:5432` |
| **Vercel — backend** | API Django (REST + admin) | `fongogestion-api.vercel.app` |
| **Vercel — frontend** | React/Vite (SPA) | `fongogestion.vercel.app` |

Deux projets Vercel séparés (un par sous-dossier du dépôt) : le front reste un
site statique, le back devient une unique Vercel Function.

---

## 1. Base de données sur Supabase

### 1.1 Créer le projet

1. [supabase.com](https://supabase.com) → **New project**.
2. Choisir une région proche de celle de Vercel (voir §2.1), puis un
   **Database password** — à noter, il ne sera pas retransmis.
3. Attendre que le projet soit « Active » (1-2 min).

### 1.2 Récupérer la bonne chaîne de connexion

Dashboard → **Connect** → **Session pooler** → copier l'URL au format
`URI` :

```
postgresql://postgres.<REF>:<MOT_DE_PASSE>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

Attention aux trois pièges classiques :

| Ce qu'il ne **pas** prendre | Pourquoi |
|---|---|
| **Direct connection** (`<ref>.db.supabase.co:5432`) | N'accepte que les IP déclarées dans *Settings → Network Access → Direct connections* → **connexion refusée** depuis une IP inconnue (ton PC, Vercel…). |
| **Transaction pooler** (`:6543`) | pgbouncer en mode « transaction » : incompatible avec certains usages de Django. `settings.py` active `DISABLE_SERVER_SIDE_CURSORS` automatiquement, mais le **Session pooler (5432)** reste le choix sûr. |
| Utilisateur `postgres` | Sur le pooler, l'utilisateur est **`postgres.<REF>`** (le code du projet, ex. `postgres.abcdefgh`). |

Et l'encodage : un mot de passe contenant `@` doit être écrit **`%40`**
(ton mot de passe local `josue@esanga1` → `josue%40esanga1`), sinon l'URL est
mal découpée et l'hôte devient `…@aws-0-…` → échec DNS puis connexion refusée.

### 1.3 Tester la connexion *avant* de toucher à Django

```bash
cd backend
python scripts/check_db.py --url "postgresql://postgres.<REF>:<MDP>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
```

Le script teste chaque étape séparément (DNS → TCP → SSL → authentification →
tables) et affiche la correction correspondante en cas d'échec :

```
✔ [OK] Résolution DNS — 3.233.x.x
✔ [OK] Connexion TCP — 3.233.x.x:5432 joignable (98 ms)
✔ [OK] Chiffrement SSL — TLSv1.3 (TLS_AES_256_GCM_SHA384)
✔ [OK] Authentification — PostgreSQL 17.x (98 ms)
✔ [OK] Base atteinte — postgres — 0 table(s) dans le schéma public
```

Sans `--url`, il utilise exactement la configuration de `settings.py`
(`DATABASE_URL` ou `DB_*`, y compris `backend/.env`).

### 1.4 Les échecs les plus fréquents

| Message | Cause | Correction |
|---|---|---|
| `connexion refusée` / timeout | IP non autorisée (connexion directe) | Utiliser le **Session pooler** (5432) ou déclarer l'IP dans *Network Access* |
| `password authentication failed` | Mauvais mot de passe ou `@` non encodé | `josue%40esanga1` ; mot de passe à régénérer dans *Connect → Settings* |
| `role "postgres" does not exist` | Utilisateur du pooler | `postgres.<REF>` |
| `la base de données "…" n'existe pas` | Mauvais segment chemin | le chemin est **`/postgres`** |
| `SSL off` / `no encryption` | SSL non forcé | `?sslmode=require` |
| `IPv6 … unreachable` | Hôte direct en IPv6 | Passer par le pooler `aws-0-<region>.pooler.supabase.com` (IPv4) |

### 1.5 Transférer les données locales

```bash
cd backend
./scripts/migrate_to_supabase.sh "postgresql://postgres.<REF>:<MDP>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
```

- Dump **SQL brut** : portable quelle que soit la version cible (local en
  PostgreSQL 18, Supabase en 15/16/17 — le format binaire `-Fc` ne l'est pas).
- Sans rôle ni privilège (`--no-owner --no-privileges`), schéma `public` seul.
- Vérification automatique en fin de course : tables, migrations Django,
  utilisateurs.
- Pour ne faire qu'un dump (inspection) : `--dump-only`.
- Les dumps sont rangés dans `backend/.dumps/` (ignoré par git).

Contrôle final :

```bash
cd backend && DATABASE_URL="…" python manage.py migrate --check && echo "schéma à jour"
```

### 1.6 Migrations suivantes

Les migrations ne s'exécutent **pas** automatiquement sur Vercel. Après
`makemigrations`, applique-les depuis ta machine contre Supabase :

```bash
cd backend
DATABASE_URL="postgresql://…" python manage.py migrate
```

---

## 2. Backend Django sur Vercel

### 2.1 Créer le projet

1. Vercel → **Add New → Project** → importer le dépôt.
2. **Root Directory : `backend`** (détecte `manage.py` → runtime Python,
   `WSGI_APPLICATION = Fongo_Gestion.wsgi`).
3. Build : `pip install -r requirements.txt`, puis **`collectstatic`
   exécuté automatiquement** par Vercel (fichiers statiques servis par le CDN).
   Pas de commande à configurer.
4. Region : même zone que Supabase pour minimiser la latence
   (variable `regions` dans `backend/vercel.json`).

### 2.2 Variables d'environnement

*Project → Settings → Environment Variables* (Production **et** Preview),
marquées **Sensitive** :

| Variable | Valeur | Rôle |
|---|---|---|
| `DATABASE_URL` | URL Session pooler de Supabase | Connexion à la base |
| `SECRET_KEY` | `python -c "from django.core.management.utils import get_random_secret_key as k; print(k())"` | Signature JWT/cookies — **changer la clé déconnecte tout le monde** |
| `DEBUG` | `False` | Désactive le mode debug |
| `CORS_ALLOWED_ORIGINS` | `https://<front>.vercel.app` | Frontend autorisé à appeler l'API |
| `CSRF_TRUSTED_ORIGINS` | `https://<front>.vercel.app` | Idem pour l'admin (POST) |
| `ALLOWED_HOSTS` | *optionnel* | `.vercel.app` est déjà autorisé ; renseigner seulement un domaine personnalisé |
| `SECURE_HSTS_SECONDS` | `0` puis `31536000` | À activer une fois le domaine perso vérifié |

Variables `SUPABASE_S3_*` (médias) : voir §4.3.

Déjà géré côté code :

- `VERCEL=1` → hôtes `*.vercel.app` acceptés, cookies `Secure` activés,
  `SECURE_PROXY_SSL_HEADER` pour HTTPS derrière le proxy Vercel.
- URL Postgres parsée y compris `sslmode` / `channel_binding` du query string
  (`unquote` compris), `DISABLE_SERVER_SIDE_CURSORS` sur le port 6543.

### 2.3 Vérifier

- `https://<back>.vercel.app/health/` → `{"status": "ok"}`
- `https://<back>.vercel.app/` → racine JSON de l'API
- `https://<back>.vercel.app/admin/` → interface d'administration
- Onglet **Logs** de Vercel pour suivre la function (durée max : 60 s,
  `backend/vercel.json`).

---

## 3. Frontend React sur Vercel

### 3.1 Créer le projet

1. Nouveau projet Vercel sur le même dépôt — **Root Directory : `frontend`**.
2. Framework détecté automatiquement (Vite) : build `npm run build`
   (`tsc -b && vite build`), sortie `dist`.
3. `frontend/vercel.json` ajoute le *rewrite* SPA : les liens profonds
   (`/dashboard`, …) retombent sur `index.html` — vérifié sans risque pour les
   assets, Vercel teste le filesystem avant les rewrites.

### 3.2 Variables d'environnement

| Variable | Valeur | Rôle |
|---|---|---|
| `VITE_API_URL` | `https://<back>.vercel.app/api` | Base des requêtes axios |
| `VITE_LUMICASH_NUMBER` | numéro Lumicash du club | Carte de paiement |

`VITE_MEDIA_URL` / `VITE_STATIC_URL` ne servent qu'au **proxy de
développement** de Vite (`vite.config.ts`) : sans effet en production, les URL
d'images proviennent de l'API (voir §4).

⚠ Ces variables sont lues **au moment du build** : après modification,
**redeploy** obligatoire.

### 3.3 Vérifier

- Connexion au front → onglet Réseau : les appels partent vers
  `https://<back>.vercel.app/api/…`, sans erreur CORS.
- Recharge directe sur `https://<front>.vercel.app/dashboard` (rewrite SPA).

---

## 4. Médias : Supabase Storage (API S3 compatible)

Le disque de Vercel est en lecture seule et éphémère : photos de membres
(`pictures/`), annonces, modules et logo de club y seraient perdus au déploiement
suivant. `settings.py` bascule automatiquement sur Supabase Storage dès que
cinq variables sont renseignées (sinon : disque local, comme en dev).

### 4.1 Créer le bucket

*Storage → New bucket* : nom `fongogestion`, visibilité **Public**.

Le bucket doit être public car les URL doivent rester **stables et non
signées** : le frontend ajoute `?v=` (cache-busting) à l'avatar, ce qui
invaliderait la signature d'une URL pré-signée.

### 4.2 Récupérer les accès S3

*Storage → Settings → S3 compatible API* → activer et copier :
l'**endpoint** (`https://<ref>.supabase.co/storage/v1/s3`), la **région**, la
**clé d'accès** et la **clé secrète**.

### 4.3 Variables d'environnement (projet Vercel — backend)

| Variable | Valeur |
|---|---|
| `SUPABASE_S3_ENDPOINT` | `https://<ref>.supabase.co/storage/v1/s3` |
| `SUPABASE_S3_BUCKET` | `fongogestion` |
| `SUPABASE_S3_REGION` | région affichée dans Storage → Settings |
| `SUPABASE_S3_ACCESS_KEY` | clé d'accès S3 |
| `SUPABASE_S3_SECRET_KEY` | clé secrète S3 |

**Les cinq sont requises** : dès qu'une manque, le stockage retombe sur disque
→ images 404 en production (aucune erreur au build).

Réglages appliqués par `settings.py` : addressing `path` (exigé par Supabase),
aucune ACL, `s3v4`, fichier homonyme non écrasé, `Cache-Control` 24 h, URL
publiques construites sur
`https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<clé>`.

### 4.4 Transférer les fichiers existants (21 fichiers, ≈ 35 Mo)

```bash
cd backend
python scripts/upload_media.py --dry-run   # aperçu des clés, sans envoi
python scripts/upload_media.py             # envoi réel
```

Idempotent : un fichier déjà présent à la bonne taille est ignoré — le
commande se relance sans risque (`--force` pour tout renvoyer). Les clés sont
conservées à l'identique (`pictures/…`, `annonces/…`, `modules/…`, `club/…`) :
**aucune valeur en base à mettre à jour**, seule l'URL renvoyée par l'API change.

### 4.5 Vérifier

- Ouvrir dans le navigateur :
  `https://<ref>.supabase.co/storage/v1/object/public/fongogestion/pictures/<fichier>.jpg`
- Dans l'application : changer sa photo de profil → la nouvelle s'affiche.
- `VITE_MEDIA_URL` ne sert qu'au proxy de développement Vite : en production
  les URL viennent de l'API, rien à changer côté React.

---

## 5. Autres points d'attention

- **Quotas du plan Free Supabase** : 500 Mo de base, 1 Go de stockage,
  2 connexions actives — largement suffisants ici (base ≈ 9 Mo, médias ≈ 35 Mo).
- **Sessions admin** : `SESSION_COOKIE_SECURE` est activé sur Vercel —
  l'admin n'est accessible qu'en HTTPS (c'est le cas par défaut).
- **`.env` local** : `settings.py` lit `backend/.env.local` puis `backend/.env`
  (tous deux ignorés par git). `vercel env pull` écrit `.env.local` →
  utilise-le pour rejouer la configuration de production en local.

---

## 6. Récapitulatif

```bash
# 1. Diagnostic de connexion (le point de départ en cas de « connexion refusée »)
cd backend && python scripts/check_db.py --url "postgresql://…"

# 2. Transfert des données locales → Supabase
./scripts/migrate_to_supabase.sh "postgresql://…"

# 3. Schéma à jour ?
DATABASE_URL="…" python manage.py migrate --check

# 4. Migrations suivantes (après un makemigrations)
DATABASE_URL="…" python manage.py migrate

# 5. Génération d'une clé secrète pour Vercel
python -c "from django.core.management.utils import get_random_secret_key as k; print(k())"
```
