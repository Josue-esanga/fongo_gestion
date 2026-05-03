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
    pictures = models.ImageField(
        upload_to="pictures/", # Le chemin d'accès vers nos photos theme/static/pictures
        null=True, #les champs peut être vide (NULL)
        blank=True # l'utilisateur n'est pas obligé de mettre une photo
    )

    def __str__(self):
        return f"{self.username} - {self.role}"
    


    

