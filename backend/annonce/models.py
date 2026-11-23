from django.db import models
from django.utils import timezone

from fongo_user.models import User


class Annonce(models.Model):
    """Annonce du club, affichée en carte, affiche ou visuel simple."""

    CIBLE_CHOICES = [
        ('tous', 'Tout le monde'),
        ('admins', 'Administrateurs'),
        ('stagiaires', 'Stagiaires'),
    ]

    TEMPLATE_CHOICES = [
        ('standard', 'Standard (carte texte)'),
        ('fongo_expo', 'FongoExpo session (affiche)'),
        ('visual', 'Annonce visuelle (image)'),
    ]

    object = models.CharField(max_length=100)
    contenu = models.TextField()
    cible = models.CharField(
        max_length=20,
        choices=CIBLE_CHOICES,
        default='tous',
    )
    template = models.CharField(
        max_length=20,
        choices=TEMPLATE_CHOICES,
        default='standard',
    )
    date_prevue = models.DateTimeField(default=timezone.now)
    # Images des deux cartes de l'affiche FongoExpo (facultatives).
    image1 = models.ImageField(upload_to='annonces/', null=True, blank=True)
    image2 = models.ImageField(upload_to='annonces/', null=True, blank=True)
    # Capture exacte de la carte d'annonce telle qu'affichée (PNG). Sert de
    # fichier téléchargé, d'image du partage et d'aperçu (og:image) de la page
    # publique `/a/<id>/`. Générée côté frontend après l'enregistrement.
    poster = models.ImageField(
        upload_to='annonces/posters/',
        null=True,
        blank=True,
        help_text="Capture PNG de l'annonce, utilisée pour le partage.",
    )
    poster_a = models.DateTimeField(auto_now_add=True)
    auteur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
    )

    class Meta:
        ordering = ['-poster_a']

    def __str__(self):
        return self.object
