from django.db import models

class User(models.Model):
    Role_choice = [
        ('super_admin','Super Admin'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
        ('admin','Administrateur'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
        ('stagiaire','Stagiaire') #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
    ]
    
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    role = models.CharField(
        max_length=20,
        choices= Role_choice,
        default= 'stagiaire'
    )
    pictures = models.ImageField(
        upload_to="static/pictures/", # Le chemin d'accès vers nos photos theme/static/pictures
        null=True, #les champs peut être vide (NULL)
        blank=True # l'utilisateur n'est pas obligé de mettre une photo
    )
    created_at = models.DateTimeField(
        auto_now_add= True
    )

    def __str__(self):
        return f"{self.name} - {self.role}"

    

