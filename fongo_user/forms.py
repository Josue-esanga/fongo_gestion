from django import forms
from .models import *

class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'pictures', 'role']
        labels = {
            'username': 'Nom d\'utilisateur',
            'email': 'Adresse e-mail',
            'password': 'Mot de passe',
            'pictures': 'Photo de profil',
            'role': 'Rôle',
        }



