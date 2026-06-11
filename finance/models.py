from django.db import models
from fongo_user.models import User

# Create your models here.

class Ajout_Argent(models.Model):
    montant = models.IntegerField( null=False , blank=False)
    categories_choises = [
        ('module','module'),
        ('autres','autres'),   
    ]
    category = models.CharField(max_length=20, choices = categories_choises, null=False , default='autres')
    description = models.CharField(max_length=100, null=False)
    created_at = models.DateTimeField( auto_now= False, auto_now_add= True)
    id_stagiaire = models.ForeignKey(
        User,
        on_delete= models.CASCADE,
        limit_choices_to={'role': 'stagiaire'},
        related_name='ajout_argent_stagiaire'
    )
    

    def __str__(self):
        return f'{self.id_stagiaire} - {self.montant} - {self.category} - {self.created_at.strftime("%Y-%m-%d %H:%M:%S")}'
    