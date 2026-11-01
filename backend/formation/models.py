from django.conf import settings
from django.db import models
from django.db.models import Q

# Create your models here.
# class Formateur (User):
#     matiere = models.CharField( max_length=50)
#     bio = models.CharField(max_length=50)


class Formateur(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil_formateur",
        limit_choices_to=Q(role="admin") | Q(is_superuser=True),
        unique=True,
    )
    matiere = models.CharField(max_length=50)
    bio = models.TextField(max_length=500)

    def __str__(self):
        return f"Formateur: {self.user.username}"


class Module(models.Model):
    """Module de la grille pédagogique.

    La relation aux formateurs est multiple : un module peut être animé par
    plusieurs formateurs et un formateur peut enseigner plusieurs modules.
    """

    ordre = models.PositiveIntegerField(default=1)
    titre = models.CharField(max_length=120)
    # Image de couverture affichée sur la carte du module (facultative).
    image = models.ImageField(upload_to="modules/", null=True, blank=True)
    duree = models.IntegerField(default=0)
    sujets = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True, default="")
    formateurs = models.ManyToManyField(
        Formateur,
        related_name="modules",
        blank=True,
    )

    class Meta:
        ordering = ("ordre", "id")

    def __str__(self):
        return self.titre
