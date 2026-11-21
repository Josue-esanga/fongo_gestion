"""Traçage automatique des écritures sur les modèles du projet.

Principe : à l'instanciation d'un modèle (`post_init`), on mémorise l'état des
champs ; à l'enregistrement (`post_save`), on compare pour ne journaliser que
les champs réellement modifiés. Les créations et suppressions sont relevées
telles quelles.

Le branchement est automatique : toutes les applications listées dans
`TRACKED_APP_LABELS` sont auditées, sans rien ajouter dans les vues.
"""

from django.apps import apps as django_apps
from django.db.models.signals import post_delete, post_init, post_save

from . import services
from .models import AuditLog

# Applications du projet dont les modèles sont audités automatiquement.
TRACKED_APP_LABELS = {
    "annonce",
    "devoir",
    "finance",
    "formation",
    "fongo_user",
    "parametre",
    "Planning",
    "presence",
}

# Clé dans `instance.__dict__` stockant l'état des champs avant enregistrement.
_SNAPSHOT_KEY = "_audit_snapshot"

_connected = False


def tracked_models():
    """Modèles auditées (l'application `audit` elle-même est exclue)."""
    return [
        model
        for model in django_apps.get_models()
        if model._meta.app_label in TRACKED_APP_LABELS
    ]


def tracked_model_labels():
    """Libellés des modèles auditées, pour l'affichage dans l'API."""
    return sorted(f"{model._meta.app_label}.{model._meta.model_name}" for model in tracked_models())


def _model_label(model) -> str:
    return f"{model._meta.app_label}.{model._meta.model_name}"


def _snapshot(instance) -> dict:
    """État courant des champs concrets déjà chargés en mémoire.

    On ne lit que `instance.__dict__` : aucun champ différé (`.only()`) ne
    déclenche de requête supplémentaire.
    """
    return {
        field.attname: instance.__dict__[field.attname]
        for field in instance._meta.concrete_fields
        if field.attname in instance.__dict__
    }


def _diff(model, before: dict, instance) -> dict:
    """Champs réellement modifiés entre `before` et l'état courant."""
    changes = {}
    for field in model._meta.concrete_fields:
        if field.attname not in before or field.attname not in instance.__dict__:
            continue
        # `auto_now` (mis à jour à chaque sauvegarde) : bruit, pas un changement.
        if getattr(field, "auto_now", False):
            continue
        # Écritures mécaniques (jeton de session, activité) : sans intérêt.
        if field.name in services.NOISE_FIELDS or field.attname in services.NOISE_FIELDS:
            continue
        old = before[field.attname]
        new = instance.__dict__[field.attname]
        if old == new:
            continue
        # Clé lisible : `auteur` plutôt que `auteur_id` pour les clés étrangères.
        changes[field.name] = {"old": services.jsonable(old), "new": services.jsonable(new)}
    return changes


def _on_post_init(sender, instance, **kwargs):
    if not services.is_auditing():
        return
    instance.__dict__[_SNAPSHOT_KEY] = _snapshot(instance)


def _on_post_save(sender, instance, created, **kwargs):
    if not services.is_auditing():
        return

    model_label = _model_label(sender)
    object_id = instance.pk or ""
    object_repr = str(instance)[:200]

    if created:
        instance.__dict__[_SNAPSHOT_KEY] = _snapshot(instance)
        services.log_event(
            AuditLog.ACTION_CREATE,
            model_label=model_label,
            object_id=object_id,
            object_repr=object_repr,
        )
        return

    before = instance.__dict__.get(_SNAPSHOT_KEY)
    if before is None:
        # Objet chargé hors d'une requête puis enregistré : impossible de
        # connaître l'état précédent, on n'invente pas de différence.
        return

    changes = _diff(sender, before, instance)
    # On repositionne l'état de référence pour la prochaine sauvegarde.
    instance.__dict__[_SNAPSHOT_KEY] = _snapshot(instance)
    if not changes:
        return

    services.log_event(
        AuditLog.ACTION_UPDATE,
        model_label=model_label,
        object_id=object_id,
        object_repr=object_repr,
        changes=changes,
    )


def _on_post_delete(sender, instance, **kwargs):
    if not services.is_auditing():
        return
    services.log_event(
        AuditLog.ACTION_DELETE,
        model_label=_model_label(sender),
        object_id=instance.pk or "",
        object_repr=str(instance)[:200],
    )


def connect_tracked_models():
    """Branche les signaux d'audit sur tous les modèles suivis (idempotent)."""
    global _connected
    if _connected:
        return
    for model in tracked_models():
        post_init.connect(_on_post_init, sender=model, weak=False)
        post_save.connect(_on_post_save, sender=model, weak=False)
        post_delete.connect(_on_post_delete, sender=model, weak=False)
    _connected = True
