from django.forms import forms
from .models import User


class UserForm(forms.Form):
    class Meta:
        fields = ['name', 'email', 'password','pictures']