#!/usr/bin/env python
"""Envoie les fichiers de `backend/media/` vers Supabase Storage.

Les clés reprises en base (`pictures/…`, `annonces/…`, `modules/…`,
`club/…`) sont conservées à l'identique : aucune valeur à mettre à jour dans
les tables, seule l'URL renvoyée par l'API change.

Usage :
    python scripts/upload_media.py --dry-run   # liste les clés, n'envoie rien
    python scripts/upload_media.py             # envoie (idempotent : un fichier
                                               # déjà présent à la bonne taille
                                               # est ignoré)
    python scripts/upload_media.py --force     # renvoie même les présents
    python scripts/upload_media.py pictures/   # un sous-dossier uniquement

Prérequis : SUPABASE_S3_ENDPOINT / _BUCKET / _REGION / _ACCESS_KEY /
_SECRET_KEY renseignées (`.env` ou environnement) — sauf pour --dry-run.
Sortie : code 0 si tout est envoyé, 1 sinon.
"""
from __future__ import annotations

import argparse
import mimetypes
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))


def build_client(settings):
    """Client boto3 aligné sur la configuration Django (mêmes réglages)."""
    import boto3
    from botocore.config import Config as BotoConfig

    return boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=BotoConfig(
            signature_version=settings.AWS_S3_SIGNATURE_VERSION,
            s3={'addressing_style': settings.AWS_S3_ADDRESSING_STYLE},
        ),
    )


def remote_size(client, bucket: str, key: str) -> int | None:
    """Taille de l'objet distant, ou None s'il n'existe pas / illisible."""
    try:
        head = client.head_object(Bucket=bucket, Key=key)
    except Exception:
        return None
    return int(head.get('ContentLength', -1))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('prefix', nargs='?', default='',
                        help='sous-dossier à traiter (ex. pictures/)')
    parser.add_argument('--dry-run', action='store_true',
                        help='affiche les clés sans rien envoyer')
    parser.add_argument('--force', action='store_true',
                        help='renvoie les fichiers déjà présents')
    args = parser.parse_args()

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Fongo_Gestion.settings')
    import django

    django.setup()
    from django.conf import settings

    media_root = Path(settings.MEDIA_ROOT)
    if not media_root.is_dir():
        print(f'  ✘ Dossier média introuvable : {media_root}')
        return 1

    files = sorted(p for p in media_root.rglob('*') if p.is_file())
    if args.prefix:
        prefix = args.prefix.strip('/')
        files = [p for p in files
                 if p.relative_to(media_root).as_posix().startswith(prefix + '/')]
        if not files:
            print(f'  ✘ Aucun fichier sous « {prefix} »')
            return 1

    if not files:
        print('  Aucun fichier dans backend/media/ — rien à transférer.')
        return 0

    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
    endpoint = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
    public_base = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', '') or ''

    print(f'\n{len(files)} fichier(s) dans {media_root}')

    # --dry-run fonctionne sans aucune configuration S3 (aperçu des clés).
    if not args.dry_run:
        missing = [
            name for name, value in [
                ('SUPABASE_S3_ENDPOINT', endpoint),
                ('SUPABASE_S3_BUCKET', bucket),
                ('SUPABASE_S3_REGION', getattr(settings, 'AWS_S3_REGION_NAME', '')),
                ('SUPABASE_S3_ACCESS_KEY', getattr(settings, 'AWS_ACCESS_KEY_ID', '')),
                ('SUPABASE_S3_SECRET_KEY', getattr(settings, 'AWS_SECRET_ACCESS_KEY', '')),
            ]
            if not value
        ]
        if missing:
            print(f'  ✘ Stockage S3 non configuré : {", ".join(missing)} manquant')
            print('    (cf. backend/.env.example → section Supabase Storage)')
            return 1
        client = build_client(settings)
    else:
        client = None

    uploaded = skipped = failed = 0
    sent_bytes = 0

    for path in files:
        key = path.relative_to(media_root).as_posix()
        size = path.stat().st_size

        if args.dry_run:
            target = f'{public_base}/{key}' if public_base else key
            print(f'  [aperçu] {key} ({size} o) → {target}')
            continue

        if not args.force and remote_size(client, bucket, key) == size:
            skipped += 1
            continue

        content_type = mimetypes.guess_type(key)[0] or 'application/octet-stream'
        try:
            client.put_object(
                Bucket=bucket,
                Key=key,
                Body=path.read_bytes(),
                ContentType=content_type,
                CacheControl='max-age=86400',
            )
        except Exception as exc:  # noqa: BLE001 — remontée complète de l'erreur
            failed += 1
            print(f'  ✘ {key} — {type(exc).__name__}: {exc}')
            continue

        uploaded += 1
        sent_bytes += size
        print(f'  ✔ {key} ({size} o)')

    if args.dry_run:
        print('\n  (aperçu : rien n’a été envoyé)')
        return 0

    print(f'\n  envoyés : {uploaded} ({sent_bytes} o) · déjà présents : {skipped} · '
          f'échecs : {failed}')
    if public_base:
        base = public_base if public_base.startswith('http') else f'https://{public_base}'
        print(f'  URL publique : {base}/<clé>')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
