from django import forms
from .models import Ajout_Argent

class AjoutArgentForm(forms.ModelForm):
    class Meta:
        model = Ajout_Argent
        fields = ['montant', 'category', 'description', "id_stagiaire"]
        labels = {
            'montant': 'Montant *',
            'category': 'Catégorie *',
            'description': 'Description *',
            'id_stagiaire': 'Stagiaire *',
        }