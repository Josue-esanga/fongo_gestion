from django.db import models


class Devoir(models.Model):
    # Public visé par le devoir : « tous » reste visible par tout le monde,
    # « frontend » / « backend » ne s'affichent que pour les stagiaires dont
    # le rôle supplémentaire correspond (voir `devoirs_visibles`).
    CIBLES = [
        ("tous", "Tous les stagiaires"),
        ("frontend", "Stagiaires Frontend"),
        ("backend", "Stagiaires Backend"),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    # Document joint au devoir (énoncé illustré, corrigé, ressources…) :
    # PDF, Word ou image. Vérifié côté serializer (extension + poids).
    file = models.FileField(
        upload_to="devoirs/",
        null=True,
        blank=True,
        verbose_name="Fichier joint",
    )
    # Nom d'origine et poids du fichier : conservés en base pour éviter une
    # requête de stockage à chaque affichage (et pour afficher un nom lisible,
    # le stockage ajoutant un suffixe aléatoire en cas d'homonymie).
    file_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Nom du fichier",
    )
    file_size = models.PositiveIntegerField(
        default=0,
        verbose_name="Poids du fichier (octets)",
    )
    limit_date = models.DateTimeField()
    cible = models.CharField(
        max_length=20,
        choices=CIBLES,
        default="tous",
        verbose_name="Public visé",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


def devoirs_visibles(user):
    """Devoirs accessibles à l'utilisateur connecté.

    - Administrateurs et super administrateurs : tous les devoirs ;
    - stagiaires : les devoirs « tous » + ceux correspondant à leurs rôles
      supplémentaires (frontend / backend) ;
    - autres utilisateurs : tous les devoirs (lecture ouverte).
    """
    queryset = Devoir.objects.all()
    if not user or not user.is_authenticated:
        return queryset.none()
    if user.is_superuser or user.role in ("admin", "super_admin"):
        return queryset
    if user.role != "stagiaire":
        return queryset
    extras = set(user.roles_supplementaires or [])
    visibles = {"tous"} | (extras & {"frontend", "backend"})
    return queryset.filter(cible__in=visibles)
