# FongoGestion — Backend

API REST Django pour la plateforme de gestion du club **FongoLab**.

Le frontend React se trouve dans le dossier voisin `../frontend`.

## Stack

- **Django 6**
- **Django REST Framework**
- **JWT** (`djangorestframework-simplejwt`)
- **drf-spectacular** (OpenAPI / Swagger / Redoc)
- **django-cors-headers**, **django-filter**
- PostgreSQL (configuration dans `Fongo_Gestion/settings.py`)

## Installation

```bash
cd backend

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

L'API est disponible sur **http://127.0.0.1:8000/api/**.

> Le venv fourni est déjà configuré. En cas de souci avec `pip`, utilisez
> `python -m pip install -r requirements.txt`.

## API REST

Les routes sont déclarées dans `Fongo_Gestion/api_urls.py` et préfixées par `/api/`.

| Méthode  | Route                           | Description                          |
| -------- | ------------------------------- | ------------------------------------ |
| POST     | `/api/auth/login/`              | Connexion (retourne les tokens JWT)  |
| POST     | `/api/auth/refresh/`            | Rafraîchissement de l'access token   |
| GET      | `/api/auth/me/`                 | Profil de l'utilisateur connecté     |
| POST     | `/api/auth/change-password/`    | Changement de mot de passe           |
| GET/POST | `/api/users/`                   | Liste / création des membres         |
| GET/POST | `/api/annonces/`                | Annonces                             |
| GET/POST | `/api/devoirs/`                 | Devoirs                              |
| GET/POST | `/api/planning/events/`         | Événements du planning               |
| GET/POST | `/api/finance/paiements/`       | Paiements                            |
| GET      | `/api/finance/students/`        | Stagiaires avec totaux               |
| GET      | `/api/finance/overview/`        | Statistiques financières             |
| GET      | `/api/formation/formateurs/`    | Formateurs                           |
| GET      | `/api/parametre/configuration/` | Configuration du club                |
| GET      | `/api/dashboard/`               | Données agrégées du tableau de bord  |

### Documentation

- Swagger UI : <http://127.0.0.1:8000/api/docs/>
- Redoc : <http://127.0.0.1:8000/api/redoc/>
- Schéma OpenAPI : <http://127.0.0.1:8000/api/schema/>

Validation du schéma :

```bash
python manage.py spectacular --file schema.yaml --validate
```

## Structure

```
backend/
├── Fongo_Gestion/   # configuration Django, urls, permissions, settings
├── fongo_user/      # utilisateurs, profils, authentification, API users
├── finance/         # paiements, stagiaires, statistiques
├── annonce/         # annonces
├── devoir/          # devoirs
├── Planning/        # événements
├── formation/       # formateurs et modules
├── parametre/       # configuration du club
├── media/           # fichiers uploadés
├── static/          # fichiers statiques
├── manage.py
└── requirements.txt
```
