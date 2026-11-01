"""Modèles de l'application présences (appel par QR code)."""

import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


class SeancePresence(models.Model):
    """Séance d'appel rattachée à un QR code (« FONGO-PRESENCE:<code> »)."""

    code = models.CharField(max_length=64, unique=True, editable=True, blank=True)
    libelle = models.CharField(max_length=200)
    date = models.DateField(default=timezone.localdate)
    ouverte = models.BooleanField(default=True)
    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='seances_presence',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at', '-id')

    def save(self, *args, **kwargs):
        if not self.code:
            # Code aléatoire : l'ancien QR affiché en salle devient invalide
            # dès qu'un nouvel appel est démarré.
            self.code = secrets.token_urlsafe(16)
        super().save(*args, **kwargs)

    @property
    def qr_payload(self) -> str:
        """Contenu encodé dans le QR code scanné par les stagiaires."""
        return f'FONGO-PRESENCE:{self.code}'

    def __str__(self) -> str:
        return f'{self.libelle} ({self.date})'


class Presence(models.Model):
    """Pointage d'un stagiaire pour une séance (un scannage par séance)."""

    seance = models.ForeignKey(
        SeancePresence,
        on_delete=models.CASCADE,
        related_name='presences',
    )
    stagiaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='presences',
    )
    horodatage = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('horodatage', 'id')
        constraints = [
            models.UniqueConstraint(
                fields=('seance', 'stagiaire'),
                name='unique_presence_par_seance',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.stagiaire.username} — {self.seance.libelle}'
