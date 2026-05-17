from django import forms
from .models import *


class AnnonceForm(forms.ModelForm):
    class Meta:
        model = Annonce 
        fields = ['object','contenu','auteur']