from django import forms
from .models import Devoir


class DevoirForm(forms.ModelForm):
    class Meta:
        model = Devoir
        fields = ['title', 'description', 'limit_date']
        widgets = {
            'limit_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }
        widgets = {
            'montant': forms.NumberInput(attrs={'placeholder': 'Entrez le montant'}),
            'description': forms.Textarea(attrs={'placeholder': 'Entrez une description', 'rows': 3}),
        }
