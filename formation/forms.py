from django import forms
from .models import Formateur, Module


class FormateurForm(forms.ModelForm):
    class Meta:
        model = Formateur
        fields = ['user','matiere', 'bio']


class ModuleForm(forms.ModelForm):
    class Meta:
        model = Module
        fields = ['cours', 'duree']
