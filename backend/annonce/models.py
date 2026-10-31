from django.db import models
from fongo_user.models import User

# Create your models here.
class Annonce(models.Model):
    object = models.CharField(max_length=100)
    contenu = models.TextField()
    poster_a = models.DateTimeField(auto_now_add= True)
    auteur = models.ForeignKey( 
        User,
        on_delete = models.CASCADE,
    )

    def __str__(self):
        return self.object
