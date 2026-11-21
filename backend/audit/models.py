"""Journal d'audit : chaque écriture du projet y laisse une trace.

Conservation illimitée : le journal est consultable depuis l'option « Audit »
du menu latéral (super administrateur uniquement) et depuis l'admin Django.
"""

from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Entrée « qui a fait quoi, quand et où » du journal d'activité."""

    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_LOGIN = "login"
    ACTION_PASSWORD = "password"

    ACTION_CHOICES = [
        (ACTION_CREATE, "Création"),
        (ACTION_UPDATE, "Modification"),
        (ACTION_DELETE, "Suppression"),
        (ACTION_LOGIN, "Connexion"),
        (ACTION_PASSWORD, "Mot de passe"),
    ]

    # Utilisateur à l'origine de l'action. `SET_NULL` : l'historique survit à
    # la suppression du compte (la colonne `username` conserve le nom).
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="utilisateur",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    # Copie du nom d'utilisateur au moment de l'action.
    username = models.CharField(max_length=150, default="anonyme", db_index=True)

    action = models.CharField(max_length=16, choices=ACTION_CHOICES, db_index=True)
    # Modèle touché, ex. `annonce.annonce` (vide pour les connexions).
    model_label = models.CharField(max_length=200, default="", blank=True, db_index=True)
    object_id = models.CharField(max_length=64, default="", blank=True)
    object_repr = models.CharField(max_length=200, default="", blank=True)
    # Modifications détaillées : {"titre": {"old": "…", "new": "…"}}.
    changes = models.JSONField(default=dict, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, default="", blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "entrée d'audit"
        verbose_name_plural = "journal d'audit"
        indexes = [
            models.Index(fields=("model_label", "created_at")),
            models.Index(fields=("user", "created_at")),
        ]

    def __str__(self):
        target = self.object_repr or self.model_label or "-"
        return f"{self.username} · {self.get_action_display()} · {target}"
