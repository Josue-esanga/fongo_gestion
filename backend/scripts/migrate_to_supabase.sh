#!/usr/bin/env bash
# =============================================================================
# migrate_to_supabase.sh — Transfère la base locale vers une base distante
# (Supabase ou tout autre PostgreSQL).
#
# Usage :
#   ./scripts/migrate_to_supabase.sh "postgresql://postgres.<ref>:pw@aws-0-….pooler.supabase.com:5432/postgres?sslmode=require"
#   DATABASE_URL="postgresql://…" ./scripts/migrate_to_supabase.sh
#   ./scripts/migrate_to_supabase.sh --dump-only "URL"    # dump seul, sans restauration
#
# Pourquoi du SQL brut (-Fp) et non un dump binaire (-Fc) :
#   PostgreSQL local en version 18, Supabase propose 15/16/17 — le format
#   binaire n'est pas rétrocompatible, le SQL l'est.
#
# Le dump n'inclut que le schéma applicatif (aucun rôle, aucun privilège) et
# embarque les données + les compteurs de migrations Django.
# =============================================================================
set -euo pipefail

DUMP_ONLY=0
if [ "${1:-}" = "--dump-only" ]; then
  DUMP_ONLY=1
  shift
fi

URL="${1:-${DATABASE_URL:-}}"
if [ -z "$URL" ]; then
  echo "Usage : $(basename "$0") \"postgresql://…\"" >&2
  echo "  (ou exporte DATABASE_URL)" >&2
  exit 1
fi
if [[ "$URL" == *"@"*"@"* ]]; then
  echo "⚠ L'URL contient deux « @ » : un « @ » du mot de passe doit être encodé %40." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_LOCAL="${DB_NAME:-Fongo_gestion_db}"
DUMP_DIR="$ROOT/.dumps"
DUMP="$DUMP_DIR/fongo_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "$DUMP_DIR"

PGPASSWORD="${DB_PASSWORD:-josue@esanga1}" pg_dump \
  -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" \
  -U "${DB_USER:-postgres}" -d "$DB_LOCAL" \
  -Fp --no-owner --no-privileges --encoding=UTF8 -f "$DUMP"

echo "✔ Dump local créé : $DUMP ($(du -h "$DUMP" | cut -f1))"

if [ "$DUMP_ONLY" = "1" ]; then
  echo "  (mode --dump-only : aucune restauration)"
  exit 0
fi

echo "→ Restauration sur la base cible…"
# -o /dev/null : les résultats (setval, set_config…) polluent la sortie,
# les erreurs restent visibles sur stderr.
psql "$URL" -v ON_ERROR_STOP=1 -q -o /dev/null -f "$DUMP"
echo "✔ Restauration terminée."

TABLES=$(psql "$URL" -Atc "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'")
MIGRATIONS=$(psql "$URL" -Atc "select count(*) from django_migrations" 2>/dev/null || echo "0")
USERS=$(psql "$URL" -Atc "select count(*) from fongo_user_user" 2>/dev/null || echo "0")

echo "  tables publiques : $TABLES"
echo "  migrations Django : $MIGRATIONS"
echo "  utilisateurs      : $USERS"

cat <<'NEXT'

Prochaine étape : vérifier que Django ne voit plus de migration à appliquer
    cd backend && DATABASE_URL="…" python manage.py migrate --check \
        && echo "schéma à jour"
NEXT
