from django.contrib.auth import login
from django.views.generic import CreateView , ListView , TemplateView
from django.urls import reverse_lazy
from .forms import FormateurForm , ModuleForm
from .models import Formateur , Module
# Create your views here.

class NommerFormateur(CreateView):
    template_name = "Assign.html"
    model = Formateur
    form_class = FormateurForm
    success_url = reverse_lazy("list_member")

    def form_valid(self, form): # Enregistre l'utilisateur dans la base de données
        user = form.save() # Enregistre l'utilisateur dans la base de données
        login(self.request, user, backend='django.contrib.auth.backends.ModelBackend') # Pour gérer la session
        return super().form_valid(form) 
    