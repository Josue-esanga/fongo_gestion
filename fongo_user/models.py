from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):

    Role_choice = [
        ('super_admin','Super Admin'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
        ('admin','Administrateur'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
        ('stagiaire','Stagiaire'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
    ]

    # Rôles supplémentaires attribuables à un admin (CRUD restreint).
    # ("valeur stockée dans la BDD","valeur affichée")
    Role_supplementaire_choice = [
        ('formateur','Formateur'), # admin + formateur : CRUD des devoirs
        ('caissier','Caissier'), # admin + caissier : CRUD de la finance
    ]

    role = models.CharField(
        max_length=20,
        choices= Role_choice,
        default= 'super_admin'
    )

    # Liste des codes de rôles supplémentaires, ex. ["formateur", "caissier"].
    roles_supplementaires = models.JSONField(default=list, blank=True)
    pictures = models.ImageField(
        upload_to="pictures/", # Le chemin d'accès vers nos photos theme/static/pictures
        null=True, #les champs peut être vide (NULL)
        blank=True # l'utilisateur n'est pas obligé de mettre une photo
    )

    def __str__(self):
        return f"{self.username} - {self.role}"

    @property
    def is_super_admin(self):
        """Vrai pour le super administrateur (flag Django ou rôle ``super_admin``)."""
        return self.is_superuser or self.role == "super_admin"

    def has_extra_role(self, code):
        """Vrai si l'utilisateur possède le rôle supplémentaire ``code``."""
        if self.is_super_admin:
            return True
        if self.role != "admin":
            return False
        roles = self.roles_supplementaires or []
        if not isinstance(roles, (list, tuple)):
            return False
        return code in roles
    


    

