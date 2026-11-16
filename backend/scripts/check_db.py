#!/usr/bin/env python
"""Diagnostique la connexion à la base de données (Supabase compris).

Chaque étape est testée séparément — analyse de l'URL, DNS, TCP, chiffrement
SSL, authentification SQL — pour dire précisément ce qui échoue et la
correction à appliquer (au lieu d'un simple « connexion refusée »).

Usage :
    python scripts/check_db.py                                  # config settings.py
    python scripts/check_db.py --url "postgresql://postgres.xxx:pw@aws-0-....pooler.supabase.com:5432/postgres?sslmode=require"

Sortie : code 0 si la connexion réussit, 1 sinon.
"""
from __future__ import annotations

import argparse
import os
import socket
import ssl
import struct
import sys
import time

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

TIMEOUT = 8.0

# Cible, renseignée dans main() avant l'appel des étapes.
HOST = ''
CURRENT_PORT = 5432
HOST_IS_SUPABASE = False

# --------------------------------------------------------------------------
# Affichage
# --------------------------------------------------------------------------
OK, KO, WARN = 'OK', 'KO', '!'


def show(status: str, title: str, detail: str = '') -> bool:
    icon = {OK: '✔', KO: '✘', WARN: '▲'}[status]
    line = f'  {icon} [{status}] {title}'
    if detail:
        line += f' — {detail}'
    print(line)
    return status != KO


def advice(lines: list[str]) -> None:
    print('\n  Correction à appliquer :')
    for line in lines:
        print(f'    • {line}')


# --------------------------------------------------------------------------
# Configuration (exactement celle que Django utilisera)
# --------------------------------------------------------------------------
def load_config(url: str | None) -> dict:
    if url:
        # settings.py lit DATABASE_URL au chargement : on l'alimente avant,
        # puis on laisse Django produire la configuration finale.
        os.environ['DATABASE_URL'] = url

    import django  # noqa: WPS433 (import tardif : l'environnement est prêt)

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Fongo_Gestion.settings')
    django.setup()

    from django.conf import settings

    cfg = dict(settings.DATABASES['default'])
    cfg['OPTIONS'] = dict(cfg.get('OPTIONS') or {})
    return cfg


# --------------------------------------------------------------------------
# Étapes de diagnostic
# --------------------------------------------------------------------------
def step_dns(host: str, port: int) -> tuple[bool, list[str]]:
    """Résolution du nom d'hôte en adresses IP."""
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        show(KO, 'Résolution DNS', str(exc))
        advice([
            "Hôte introuvable : vérifie le nom dans l'URL de connexion.",
            'Supabase : Dashboard → Connect → Session pooler → copier l’hôte '
            'exact (ex. aws-0-eu-west-3.pooler.supabase.com).',
        ])
        return False, []

    addresses: list[str] = []
    for family, _, _, _, sockaddr in infos:
        ip = sockaddr[0]
        if ip not in addresses:
            addresses.append(ip)

    only_ipv6 = bool(addresses) and all(':' in ip for ip in addresses)
    detail = ', '.join(addresses)
    if only_ipv6:
        show(WARN, 'Résolution DNS', f'{detail} (IPv6 uniquement)')
        advice([
            'Ce nom ne résout qu’en IPv6 : si ta machine/environnement '
            'n’a pas d’IPv6, la connexion échouera.',
            'Utilise plutôt l’hôte du pooler '
            '(aws-0-<region>.pooler.supabase.com), qui résout en IPv4.',
        ])
    else:
        show(OK, 'Résolution DNS', detail)
    return True, addresses


def step_tcp(host: str, addresses: list[str]) -> bool:
    """Connexion TCP de base (le refus d’accès IP se voit ici)."""
    started = time.time()
    last: tuple[str, str] | None = None
    for ip in addresses or [host]:
        try:
            with socket.create_connection((ip, CURRENT_PORT), timeout=TIMEOUT):
                elapsed = int((time.time() - started) * 1000)
                show(OK, 'Connexion TCP', f'{ip}:{CURRENT_PORT} joignable ({elapsed} ms)')
                return True
        except socket.timeout:
            last = ('timeout', ip)
        except ConnectionRefusedError:
            last = ('refused', ip)
        except OSError as exc:
            last = ('os', ip, str(exc))

    kind = last[0] if last else 'unknown'
    ip = last[1] if last else host

    if kind == 'refused':
        show(KO, 'Connexion TCP', f'{ip}:{CURRENT_PORT} → connexion refusée')
        if HOST_IS_SUPABASE and CURRENT_PORT == 5432 and '.pooler.' not in HOST:
            advice([
                'Sur Supabase, la connexion « Direct » (xxx.db.supabase.co) '
                'n’est ouverte qu’aux IP déclarées : '
                'Settings → Network Access → Direct connections → ton adresse IP.',
                'Solution simple et recommandée : utiliser le Session pooler '
                '(port 5432, hôte aws-0-<region>.pooler.supabase.com), qui '
                'n’exige pas de liste d’IP.',
                'Ou ouvrir l’accès à 0.0.0.0/0 dans Direct connections '
                '(moins recommandé).',
            ])
        elif CURRENT_PORT == 6543:
            advice([
                'Port 6543 (transaction pooler) refusé : vérifie que le pooler '
                'est bien activé (Dashboard → Connect → Transaction pooler) et '
                'que le pare-feu sortant autorise ce port.',
            ])
        else:
            advice([
                'Vérifie l’hôte et le port, puis l’accès réseau sortant '
                '(proxy/pare-feu) vers PostgreSQL.',
            ])
    elif kind == 'timeout':
        show(KO, 'Connexion TCP', f'{ip}:{CURRENT_PORT} → délai dépassé ({int(TIMEOUT)} s)')
        advice([
            'Paquet noyé : IP non autorisée, pare-feu, ou mauvais port.',
            'Sur Supabase, ajoute ton IP dans '
            'Settings → Network Access, ou passe par le pooler (port 5432).',
        ])
    else:
        detail = last[2] if len(last) > 2 else kind
        show(KO, 'Connexion TCP', f'{ip} → {detail}')
        if 'unreachable' in str(detail).lower() or 'network is unreachable' in str(detail).lower():
            advice([
                'Réseau IPv6 inaccessible : utilise l’hôte du pooler '
                '(aws-0-<region>.pooler.supabase.com) qui résout en IPv4.',
            ])
        else:
            advice(["Vérifie l’hôte, le port et l’accès réseau sortant."])
    return False


def step_ssl(host: str, required: bool = True) -> bool:
    """Négociation SSL de PostgreSQL (paquet SSLRequest, protocole 80877103).

    `required=False` (sslmode=prefer) : un refus de SSL n'est pas bloquant,
    il n'est signalé que comme avertissement.
    """
    raw = None
    tls = None
    status = KO if required else WARN

    try:
        raw = socket.create_connection((host, CURRENT_PORT), timeout=TIMEOUT)
        # SSLRequest : Int32(8) longueur du message, Int32(80877103) code.
        raw.sendall(struct.pack('!II', 8, 80877103))
        answer = raw.recv(1)
        if answer == b'N':
            show(status, 'Chiffrement SSL', 'le serveur refuse SSL')
            if required:
                advice([
                    'SSL refusé : sur Supabase, force sslmode=require dans '
                    'l’URL de connexion (…?sslmode=require).',
                ])
            return not required
        if answer != b'S':
            show(status, 'Chiffrement SSL', f'réponse inattendue {answer!r}')
            if required:
                advice(['Le port ciblé n’est probablement pas un port PostgreSQL.'])
            return not required

        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        tls = context.wrap_socket(raw, server_hostname=host)
        cipher = tls.cipher()[0] if tls.cipher() else '?'
        show(OK, 'Chiffrement SSL', f'{tls.version()} ({cipher})')
        return True
    except ssl.SSLError as exc:
        show(status, 'Chiffrement SSL', str(exc))
        if required:
            advice([
                'Erreur TLS : vérifie sslmode dans l’URL '
                '(require convient à Supabase ; verify-full exige un certificat valide).',
            ])
        return not required
    except OSError as exc:
        show(status, 'Chiffrement SSL', str(exc))
        return not required
    finally:
        for sock in (tls, raw):
            try:
                if sock is not None:
                    sock.close()
            except OSError:
                pass


def step_auth(cfg: dict) -> bool:
    """Connexion réelle psycopg2 : authentification, base, tables."""
    try:
        import psycopg2
    except ImportError:
        show(KO, 'Authentification', 'psycopg2 non installé (pip install -r requirements.txt)')
        return False

    kwargs = {
        'host': cfg['HOST'],
        'port': cfg['PORT'],
        'dbname': cfg['NAME'],
        'user': cfg['USER'],
        'password': cfg['PASSWORD'],
        'connect_timeout': int(TIMEOUT),
    }
    kwargs.update(cfg['OPTIONS'])

    started = time.time()
    try:
        conn = psycopg2.connect(**kwargs)
    except Exception as exc:  # psycopg2 exposes plusieurs types d'erreurs
        _explain_auth_error(exc)
        return False

    try:
        with conn.cursor() as cur:
            cur.execute('select version()')
            version = cur.fetchone()[0].split(',')[0]
            cur.execute(
                "select count(*) from information_schema.tables "
                "where table_schema = 'public' and table_type = 'BASE TABLE'"
            )
            tables = cur.fetchone()[0]
        elapsed = int((time.time() - started) * 1000)
        show(OK, 'Authentification', f'{version} ({elapsed} ms)')
        show(OK, 'Base atteinte',
             f'{cfg["NAME"]} — {tables} table(s) dans le schéma public')
        return True
    except Exception as exc:
        show(KO, 'Requête de test', str(exc).strip())
        return False
    finally:
        conn.close()


def _matches(text: str, *patterns: str) -> bool:
    """Recherche insensible à la casse (les messages serveur peuvent être EN
    comme FR selon la locale de l'instance — Supabase parle anglais, un
    PostgreSQL local français)."""
    lowered = text.lower()
    return any(pattern.lower() in lowered for pattern in patterns)


def _explain_auth_error(exc: Exception) -> None:
    """Traduit l'erreur psycopg2 en conseil concret.

    psycopg2 laisse `pgcode` à None sur les FATAL émis pendant l'ouverture de
    la connexion : la détection repose donc sur le texte du message.
    """
    code = getattr(exc, 'pgcode', None)
    text = str(exc).strip()
    first_line = text.splitlines()[0] if text else type(exc).__name__
    on_pooler = '.pooler.' in HOST or CURRENT_PORT in (5432, 6543) and HOST_IS_SUPABASE

    if code == '28P01' or _matches(
        text,
        'password authentication failed',
        'authentification par mot de passe échouée',
        'authentication failed',
        'no password supplied',
        'mot de passe manquant',
    ):
        show(KO, 'Authentification', 'identifiants refusés')
        if on_pooler:
            advice([
                'Sur le pooler, l’utilisateur doit être '
                'postgres.<PROJET_REF> (ex. postgres.abcdefgh) — pas « postgres ».',
                'Le mot de passe est celui de '
                'Dashboard → Connect → Database password (pas la clé service_role).',
                'Un mot de passe contenant « @ » doit être encodé en URL : '
                '%40 (ex. josue%40esanga1).',
            ])
        else:
            advice([
                'Vérifie l’utilisateur et le mot de passe '
                '(Supabase : Dashboard → Connect → Settings).',
                'Un mot de passe contenant « @ » doit être encodé en URL : %40.',
                'Si le mot de passe vient d’un .env, il peut différer de celui '
                'du pooler : régénère-le dans le dashboard Supabase.',
            ])
    elif code == '3D000' or (
        _matches(text, 'database', 'base de données')
        and _matches(text, 'does not exist', "n'existe pas", 'introuvable')
    ):
        show(KO, 'Authentification', f'base introuvable — {first_line}')
        advice([
            'Le nom de base sur Supabase est « postgres » '
            '(pas le nom de ta base locale).',
            'Corrige le segment chemin de l’URL : '
            'postgresql://postgres.<ref>:…@…/postgres?sslmode=require',
        ])
    elif _matches(text, 'role', 'rôle', 'user') and _matches(
        text, 'does not exist', "n'existe pas", 'n’existe pas',
    ):
        show(KO, 'Authentification', f'utilisateur inconnu — {first_line}')
        advice([
            'Sur le pooler Supabase, l’utilisateur est '
            'postgres.<PROJET_REF> (ex. postgres.abcdefgh), pas « postgres ».',
            'Copie l’URL exacte : Dashboard → Connect → Session pooler.',
        ])
    elif code == '28000' or _matches(
        text, 'no pg_hba.conf entry', 'aucune entrée pg_hba', 'not allowed',
        'ip address',
    ):
        show(KO, 'Authentification', 'IP non autorisée (pg_hba)')
        advice([
            'Ajoute ton adresse IP : Supabase → Settings → Network Access → '
            'Direct connections, ou ouvre 0.0.0.0/0.',
            'Sinon utilise le Session pooler (port 5432), qui n’exige pas de '
            'liste d’IP.',
        ])
    elif _matches(text, 'ssl off', 'ssl is not supported', 'ne prend pas en charge ssl',
                  'server does not support ssl'):
        show(KO, 'Authentification', 'le serveur exige/refuse SSL')
        advice([
            'Sur Supabase, ajoute ?sslmode=require à l’URL de connexion.',
            'Si l’URL contient déjà sslmode=disable, retire-le : Supabase '
            'n’accepte que les connexions chiffrées.',
        ])
    elif _matches(text, 'channel binding'):
        show(KO, 'Authentification', 'channel binding requis')
        advice(['Ajoute &channel_binding=require à l’URL de connexion.'])
    elif _matches(text, 'could not translate host name', 'nom d’hôte', 'name or service not known'):
        show(KO, 'Authentification', 'hôte introuvable')
        advice(['Vérifie le nom d’hôte dans l’URL.'])
    elif _matches(text, 'too many connections', 'trop de connexions'):
        show(KO, 'Authentification', 'nombre maximum de connexions atteint')
        advice([
            'Supabase a épuisé ses connexions : ferme les sessions ouvertes, '
            'et garde DB_CONN_MAX_AGE=0 (défaut) sur Vercel.',
            'Utilise le Session pooler (port 5432) qui multiplexe les clients.',
        ])
    elif _matches(text, 'timeout', 'délai dépassé', 'connection refused', 'connexion refusée'):
        show(KO, 'Authentification', 'connexion interrompue')
        advice(['IP ou port non joignable : voir les étapes précédentes.'])
    else:
        show(KO, 'Authentification', first_line)
        advice(['Erreur non reconnue : recopie l’URL complète depuis '
                'Supabase → Dashboard → Connect → Session pooler (port 5432), '
                'puis relance ce script avec --url "…"'])


# --------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', help='URL de connexion Postgres à tester')
    parser.add_argument('--skip-ssl', action='store_true',
                        help='ne teste pas la négociation SSL isolément')
    args = parser.parse_args()

    global HOST, CURRENT_PORT, HOST_IS_SUPABASE

    try:
        cfg = load_config(args.url)
    except Exception as exc:
        print(f'  ✘ [KO] Chargement de la configuration — {exc}')
        return 1

    HOST = cfg['HOST']
    CURRENT_PORT = int(cfg['PORT'])
    HOST_IS_SUPABASE = HOST.endswith('supabase.co') or 'pooler.supabase' in HOST

    print('\nDiagnostic de la connexion PostgreSQL')
    print('  ' + '-' * 60)
    masked = ('***' if cfg['PASSWORD'] else '(vide)')
    print(f'  hôte   : {HOST}')
    print(f'  port   : {CURRENT_PORT}')
    print(f'  base   : {cfg["NAME"]}')
    print(f'  user   : {cfg["USER"]}')
    print(f'  mdp    : {masked}')
    print(f'  ssl    : {cfg["OPTIONS"].get("sslmode", "prefer (défaut libpq)")}')
    print(f'  source : {"DATABASE_URL" if args.url or os.environ.get("DATABASE_URL") else "settings.py (DB_*)"}')
    print('  ' + '-' * 60)

    if not HOST:
        show(KO, 'Configuration', 'aucun hôte défini')
        advice(['Renseigne DATABASE_URL ou DB_HOST (cf. backend/.env.example).'])
        return 1

    if CURRENT_PORT == 6543:
        show(WARN, 'Mode pooler', 'port 6543 = transaction pooler')
        advice([
            'Le transaction pooler limite Django : settings.py active '
            'automatiquement DISABLE_SERVER_SIDE_CURSORS, mais le Session '
            'pooler (port 5432) reste le choix sûr pour Django.',
        ])
    elif HOST_IS_SUPABASE and '.pooler.' not in HOST:
        show(WARN, 'Mode de connexion', 'connexion directe (xxx.db.supabase.co)')
        advice([
            'La connexion directe exige la déclaration de ton IP '
            '(Settings → Network Access → Direct connections).',
            'Alternatif : Session pooler, port 5432.',
        ])

    ok_dns, addresses = step_dns(HOST, CURRENT_PORT)
    if not ok_dns:
        return 1

    if not step_tcp(HOST, addresses):
        return 1

    if not args.skip_ssl:
        sslmode = cfg['OPTIONS'].get('sslmode', 'prefer')
        if sslmode != 'disable':
            # `prefer` : SSL bienvenu mais pas exigé (défaut libpq, local).
            required = sslmode in ('require', 'verify-ca', 'verify-full')
            if not step_ssl(HOST, required=required) and required:
                return 1

    if not step_auth(cfg):
        return 1

    print('\n  ✔ Connexion réussie : Django pourra se connecter avec cette configuration.')
    if HOST_IS_SUPABASE:
        print('    Prochaine étape : env/bin/python manage.py migrate '
              '(puis scripts/migrate_to_supabase.sh pour les données existantes).')
    print()
    return 0


if __name__ == '__main__':
    sys.exit(main())
