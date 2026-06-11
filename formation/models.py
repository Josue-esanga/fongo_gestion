from django.db import models
from django.conf import settings
from fongo_user.models import User
from django.db.models import Q

# Create your models here.
# class Formateur (User):
#     matiere = models.CharField( max_length=50)
#     bio = models.CharField(max_length=50)


class Formateur(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE, 
        related_name='profil_formateur',
        limit_choices_to=Q(role='admin') | Q(is_superuser=True),
        unique= True
        )
    matiere = models.CharField(max_length=50)
    bio = models.TextField(max_length=500) 

    def __str__(self):
        return f"Formateur: {self.user.username}"


class Module(models.Model):
    cours = models.CharField(max_length=40)
    duree = models.IntegerField()
    id_formateur = models.ForeignKey(
        Formateur,
        on_delete= models.CASCADE
        
    )

    def __str__(self):
        return f'{self.cours}-{self.id_formateur}'
