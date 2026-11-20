from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):

    Role_choice = [
        ('super_admin','Super Admin'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
        ('admin','Administrateur'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
        ('stagiaire','Stagiaire'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
    ]
     
    role = models.CharField(
        max_length=20,
        choices= Role_choice,
        default= 'super_admin'
    )
    # Rôles opérationnels supplémentaires d'un administrateur :
    # formateur → devoirs, caissier → finance, communication → annonces.
    roles_supplementaires = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Rôles supplémentaires",
    )
    pictures = models.ImageField(
        upload_to="pictures/", # Le chemin d'accès vers nos photos theme/static/pictures
        null=True, #les champs peut être vide (NULL)
        blank=True # l'utilisateur n'est pas obligé de mettre une photo
    )
    # Dernière requête authentifiée émise par l'utilisateur. Permet d'afficher
    # un statut de session dynamique (« Actif » / « Inactif ») dans la liste
    # des membres, au lieu du seul drapeau de compte `is_active`.
    last_seen = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Dernière activité",
        help_text="Dernière requête authentifiée de l'utilisateur.",
    )

    def __str__(self):
        return f"{self.username} - {self.role}"
    


    

