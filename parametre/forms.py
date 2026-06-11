from django import forms
from fongo_user.models import User  # Importez votre modèle utilisateur personnalisé

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email',  'pictures']
        
        widgets = {
            'first_name': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 transition duration-200'
            }),
            'last_name': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 transition duration-200'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 transition duration-200'
            }),
           
            'pictures': forms.FileInput(attrs={
                'class': 'w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-slate-200 rounded-xl p-2 bg-slate-50'
            }),
        }