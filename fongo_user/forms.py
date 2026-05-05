from django.contrib.auth.forms import UserCreationForm
# from django import forms
from .models import *

class UserForm(UserCreationForm):
    class Meta (UserCreationForm.Meta):
        model = User
        fields = ['username', 'email' , 'pictures', 'role']
        labels = {
            'username': 'Nom d\'utilisateur',
            'email': 'Adresse e-mail',
            'password': 'Mot de passe',
            'pictures': 'Photo de profil',
            'role': 'Rôle',
            
        }



