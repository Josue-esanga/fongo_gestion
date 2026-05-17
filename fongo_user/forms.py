from django.contrib.auth.forms import UserCreationForm
from django import forms
from .models import *

class UserForm(UserCreationForm):
    class Meta (UserCreationForm.Meta):
        model = User
        fields = ['last_name','first_name','username', 'email' , 'pictures', 'role',]
        labels = {
            'username': 'Nom d\'utilisateur *',
            'email': 'Adresse e-mail *',
            'pictures': 'Photo de profil ',
            'role': 'Rôle',
            'last_name': 'Nom',
            'first_name': 'Prénom',
            
        }



class ModifyForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['last_name','first_name','username', 'email' , 'pictures', 'role',]
        labels = {
            'username': 'Nom d\'utilisateur *',
            'email': 'Adresse e-mail *',
            'pictures': 'Photo de profil ',
            'role': 'Rôle',
            'last_name': 'Nom',
            'first_name': 'Prénom',
            
        }

