from django.db import models
from fongo_user.models import User

# Create your models here.
class Formateur (User):
    matiere = models.CharField( max_length=50)
    bio = models.CharField(max_length=50)

class Module(models.Model):
    cours = models.CharField(max_length=50)
    duree = models.IntegerField()
    id_formateur = models.ForeignKey(
        Formateur,
        on_delete= models.CASCADE
        
    )

    def __str__(self):
        return f'{self.cours}-{self.id_formateur}'
