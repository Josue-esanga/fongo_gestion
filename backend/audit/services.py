"""Écriture du journal d'audit (journal d'activité du projet).

Toutes les écritures sont « best effort » : une erreur de journalisation ne
doit jamais faire échouer la requête métier qui l'a provoquée.
"""

import logging
from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID

from .middleware import client_ip, current_request

logger = logging.getLogger("audit")

# Champs qui ne déclenchent jamais d'entrée : écritures mécaniques (jeton de
# session, activité observée) sans intérêt pour « qui a fait quoi ».
NOISE_FIELDS = {"last_login", "last_seen"}

# Champs dont la valeur est masquée dans le journal (hashs, secrets).
SENSITIVE_FIELDS = {"password"}


def is_auditing() -> bool:
    """Vrai pendant une requête HTTP : c'est là que l'audit est actif.

    Hors requête (commandes de gestion, migrations), les écritures ne sont pas
    tracées : elles n'ont pas d'auteur identifiable.
    """
    return current_request() is not None


def jsonable(value):
    """Convertit une valeur de champ Django en objet JSON-serializable."""
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, (list, tuple, set)):
        return [jsonable(item) for item in value]
    if isinstance(value, dict):
        return {str(key): jsonable(item) for key, item in value.items()}
    if isinstance(value, (bytes, bytearray)):
        return value.decode("utf-8", "replace")
    # Repli universel : jamais d'exception sur une valeur exotique.
    return str(value)


def _mask(changes):
    """Remplace la valeur des champs sensibles par des pastilles."""
    for field in changes:
        if field in SENSITIVE_FIELDS:
            changes[field] = {"old": "••••••", "new": "••••••"}
    return changes


def log_event(
    action,
    *,
    user=None,
    model_label="",
    object_id="",
    object_repr="",
    changes=None,
):
    """Ajoute une entrée au journal. Ne lève jamais d'exception."""
    from .models import AuditLog

    request = current_request()
    actor = user
    if actor is None and request is not None:
        actor = getattr(request, "user", None)
    if actor is not None and not getattr(actor, "is_authenticated", False):
        actor = None

    ip_address = client_ip(request)
    user_agent = ""
    if request is not None:
        user_agent = (request.META.get("HTTP_USER_AGENT") or "")[:255]

    try:
        AuditLog.objects.create(
            user=actor,
            username=(getattr(actor, "username", "") or "anonyme") if actor else "anonyme",
            action=action,
            model_label=model_label,
            object_id=str(object_id or ""),
            object_repr=str(object_repr or "")[:200],
            changes=_mask(changes or {}),
            ip_address=ip_address,
            user_agent=user_agent,
        )
    except Exception:  # noqa: BLE001 - l'audit ne doit jamais casser la requête.
        logger.exception("Échec d'écriture dans le journal d'audit")
