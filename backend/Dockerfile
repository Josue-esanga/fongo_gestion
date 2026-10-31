# =============================================================================
# Dockerfile - Backend Django (Fongo Gestion)
# =============================================================================
FROM python:3.11-slim

# Éviter que Python n'écrive des .pyc et bufferise les logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dépendances système pour psycopg2 (PostgreSQL) et Pillow
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        build-essential \
        libpq-dev \
        libjpeg-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY . .

# Exposition du port Django
EXPOSE 8000

# Commande par défaut : lance le serveur de développement sur toutes les interfaces
# En production, remplacer par gunicorn ou uwsgi.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
