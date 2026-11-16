#!/usr/bin/env bash
# =============================================================================
# dev.sh - Démarre tout l'environnement local FongoGestion
#   PostgreSQL + backend Django + frontend Vite
#
# Usage : ./dev.sh
#   - Base de données : PostgreSQL déjà démarré sur DB_HOST:DB_PORT, sinon
#                       cluster local backend/.pgdata (créé au 1er lancement)
#   - Backend         : http://127.0.0.1:8000
#   - Frontend        : http://127.0.0.1:5173
#   Ctrl+C arrête Django et Vite (PostgreSQL reste démarré).
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PGDATA="${PGDATA:-$ROOT/backend/.pgdata}"
# Configuration de la base : mêmes valeurs par défaut que
# backend/Fongo_Gestion/settings.py. Surchargables par variables d'environnement.
DB_NAME="${DB_NAME:-Fongo_gestion_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-josue@esanga1}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
export DB_NAME DB_USER DB_PASSWORD DB_HOST DB_PORT
LOG_DIR="$ROOT/.logs"
SOCKET_DIR="/tmp/fongo-pg"

PG_BIN="$(pg_config --bindir 2>/dev/null || true)"
if [ -z "$PG_BIN" ] || [ ! -x "$PG_BIN/pg_ctl" ]; then
  PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
fi
if [ -z "$PG_BIN" ] || [ ! -x "$PG_BIN/pg_ctl" ]; then
  echo "Erreur : PostgreSQL est introuvable. Installe-le avec :"
  echo "  sudo apt install postgresql"
  exit 1
fi

mkdir -p "$LOG_DIR" "$SOCKET_DIR"

for port in 8000 5173; do
  if ss -ltn 2>/dev/null | grep -q ":$port "; then
    echo "Erreur : le port $port est déjà utilisé."
    echo "Arrête l'instance déjà lancée (Ctrl+C dans son terminal) puis relance ./dev.sh"
    exit 1
  fi
done

# ---------------------------------------------------------------------------
# 1. PostgreSQL
# ---------------------------------------------------------------------------
# On privilégie une instance PostgreSQL déjà démarrée (celle du système).
# Si rien n'écoute sur DB_HOST:DB_PORT, on démarre le cluster local au projet.
export PGPASSWORD="$DB_PASSWORD"

psql_admin() {
  local user="$1"
  shift
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$user" -d postgres -v ON_ERROR_STOP=1 "$@"
}

PG_SERVER_USER=""

# Cherche un utilisateur permettant de se connecter (instance système ou
# cluster local déjà démarré, dont le superuser peut être « fongo »).
if pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
  for candidate in "$DB_USER" fongo postgres; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$candidate" -d postgres \
      -tAc "SELECT 1" >/dev/null 2>&1; then
      PG_SERVER_USER="$candidate"
      break
    fi
  done
  if [ -n "$PG_SERVER_USER" ]; then
    echo "→ PostgreSQL déjà démarré sur $DB_HOST:$DB_PORT (utilisateur $PG_SERVER_USER)"
  else
    echo "Erreur : PostgreSQL écoute sur $DB_HOST:$DB_PORT mais la connexion échoue."
    echo "  Vérifie DB_USER/DB_PASSWORD ou arrête l'instance qui occupe le port."
    exit 1
  fi
fi

if [ -z "$PG_SERVER_USER" ]; then
  if [ ! -d "$PGDATA" ]; then
    echo "→ Initialisation de la base PostgreSQL locale ($PGDATA)..."
    "$PG_BIN/initdb" -D "$PGDATA" -U "$DB_USER" \
      --auth-local=trust --auth-host=trust -E UTF8 >"$LOG_DIR/initdb.log" 2>&1
  fi

  echo "→ Démarrage de PostgreSQL sur $DB_HOST:$DB_PORT..."
  if ! "$PG_BIN/pg_ctl" -D "$PGDATA" -l "$LOG_DIR/postgres.log" \
    -o "-p $DB_PORT -c listen_addresses=$DB_HOST -c unix_socket_directories=$SOCKET_DIR" \
    start >/dev/null; then
    echo "Erreur : impossible de démarrer PostgreSQL sur $DB_HOST:$DB_PORT."
    echo "  Logs : $LOG_DIR/postgres.log"
    exit 1
  fi
  sleep 1

  # Le cluster local peut avoir été initialisé avec un autre superutilisateur
  # (ex. « fongo ») : on le détecte avant de créer la base/le rôle attendus.
  for candidate in "$DB_USER" fongo postgres; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$candidate" -d postgres \
      -tAc "SELECT 1" >/dev/null 2>&1; then
      PG_SERVER_USER="$candidate"
      break
    fi
  done

  if [ -z "$PG_SERVER_USER" ]; then
    echo "Erreur : impossible de se connecter au PostgreSQL local ($DB_HOST:$DB_PORT)."
    echo "  Logs : $LOG_DIR/postgres.log"
    exit 1
  fi
fi

# Rôle applicatif (utile seulement si le cluster local a un autre superuser).
if ! psql_admin "$PG_SERVER_USER" -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1; then
  echo "→ Création du rôle $DB_USER..."
  psql_admin "$PG_SERVER_USER" -c \
    "CREATE ROLE \"$DB_USER\" LOGIN SUPERUSER PASSWORD '$DB_PASSWORD';" >/dev/null
fi

if ! psql_admin "$PG_SERVER_USER" -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  echo "→ Création de la base $DB_NAME..."
  psql_admin "$PG_SERVER_USER" -c \
    "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";" >/dev/null
fi

unset PGPASSWORD

# ---------------------------------------------------------------------------
# 2. Backend Django
# ---------------------------------------------------------------------------
cd "$ROOT/backend"
if [ ! -x "env/bin/python" ]; then
  echo "Erreur : environnement Python introuvable (backend/env)."
  echo "  python3 -m venv env && source env/bin/activate && pip install -r requirements.txt"
  exit 1
fi

echo "→ Application des migrations..."
env/bin/python manage.py migrate --noinput >/dev/null

echo "→ Démarrage du backend sur http://127.0.0.1:8000"
env/bin/python manage.py runserver 127.0.0.1:8000 >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# ---------------------------------------------------------------------------
# 3. Frontend Vite
# ---------------------------------------------------------------------------
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  echo "→ Installation des dépendances npm..."
  npm install
fi

echo "→ Démarrage du frontend sur http://127.0.0.1:5173"
npm run dev >"$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

cleanup() {
  echo
  echo "→ Arrêt du backend et du frontend..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo "PostgreSQL reste démarré (arrêt : $PG_BIN/pg_ctl -D \"$PGDATA\" stop)"
}
trap cleanup INT TERM EXIT

sleep 3
echo
echo "============================================================"
echo " FongoGestion est lancé :"
echo "   Frontend : http://127.0.0.1:5173"
echo "   API      : http://127.0.0.1:8000/api/"
echo "   Swagger  : http://127.0.0.1:8000/api/docs/"
echo " Logs : $LOG_DIR"
echo "============================================================"
echo

wait
