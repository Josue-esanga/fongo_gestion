from django.db import models

# Create your models here.

class Configuration(models.Model):
    nom_club = models.CharField(max_length=100, default="FongoLab")
    logo = models.ImageField(upload_to='club/', blank=True, null=True)
    frais_formation = models.IntegerField(default=150000, help_text="Montant en Fbu")
    
    class Meta:
        verbose_name = "Configuration Générale"

    def __str__(self):
        return self.nom_club
