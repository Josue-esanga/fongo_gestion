from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class User(models.Model):
    username = models.CharField(max_length=50)
    email = models.EmailField(null=False, unique=True)
    password = models.CharField(max_length=100)

    def save(self, *args, **kwargs):
        if self.password and not self.password.startswith(('pbkdf2_sha256$', 'bcrypt', 'argon2')):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    Role_choice = [
        ('super_admin','Super Admin'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
        ('admin','Administrateur'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
        ('stagiaire','Stagiaire'), #le role sont stocké dans le tuple/ ("valeur stockée dans la BDD","valeur affichée")
    ]
   
    role = models.CharField(
        max_length=20,
        choices= Role_choice,
        default= 'stagiaire'
    )
    pictures = models.ImageField(
        upload_to="pictures/", # Le chemin d'accès vers nos photos theme/static/pictures
        null=True, #les champs peut être vide (NULL)
        blank=True # l'utilisateur n'est pas obligé de mettre une photo
    )

    def __str__(self):
        return f"{self.username} - {self.role}"

    

