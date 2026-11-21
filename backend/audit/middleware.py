"""Contexte de requête utilisé par le journal d'audit.

Le middleware mémorise la requête en cours (utilisateur, IP, agent
utilisateur) dans une variable de contexte : les signaux de modèles, eux, ne
reçoivent aucune information sur l'appelant.
"""

import ipaddress
from contextvars import ContextVar

_current_request: ContextVar = ContextVar("fongo_audit_request", default=None)


def set_current_request(request):
    """Place `request` dans le contexte courant, renvoie le jeton à resetter."""
    return _current_request.set(request)


def reset_current_request(token) -> None:
    _current_request.reset(token)


def current_request():
    """Requête HTTP en cours, ou `None` hors requête (commandes, migrations)."""
    return _current_request.get()


def client_ip(request):
    """Adresse IP du client, en tenant compte d'un éventuel proxy (X-Forwarded-For)."""
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR") or ""
    candidate = forwarded.split(",")[0].strip() or request.META.get("REMOTE_ADDR") or ""
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        # Adresse illisible (liste d'en-tête inattendue) : on n'enregistre rien
        # plutôt que de faire échouer l'écriture du journal.
        return None


class AuditContextMiddleware:
    """Expose la requête courante à l'application d'audit pendant la requête."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = set_current_request(request)
        try:
            return self.get_response(request)
        finally:
            reset_current_request(token)
