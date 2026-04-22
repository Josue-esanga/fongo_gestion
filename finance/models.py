from django.db import models
from fongo_user.models import User

# Create your models here.

class Ajout_Argent(models.Model):
    montant = models.IntegerField(default=0, null= False)
    description = models.TextField(null=False)
    created_at = models.DateTimeField( auto_now= False, auto_now_add= True)
    id_stagiaire = models.ForeignKey(
        User,
        on_delete= models.CASCADE
    )

    def __str__(self):
        return self.montant
    