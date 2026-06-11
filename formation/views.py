from django.contrib.auth import login
from django.views.generic import CreateView , ListView , TemplateView , DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .forms import FormateurForm , ModuleForm
from .models import Formateur , Module
# Create your views here.

class NommerFormateur(LoginRequiredMixin,CreateView):
    template_name = "Assign.html"
    model = Formateur
    form_class = FormateurForm
    success_url = reverse_lazy("list_formateurs")

    # def form_valid(self, form): # Enregistre l'utilisateur dans la base de données
    #     form.save() # Enregistre l'utilisateur dans la base de données
    #     # login(self.request, user, backend='django.contrib.auth.backends.ModelBackend') # Pour gérer la session
    #     return super().form_valid(form) 
    
class DeleteFormateur(LoginRequiredMixin, DeleteView):
    model = Formateur
    template_name = "delete_formateur.html"
    success_url = reverse_lazy("list_formateurs")
       

class List_formateurs(LoginRequiredMixin, ListView):
    template_name = "list_formateurs.html"
    model = Formateur
    context_object_name = "formateurs"
    def get_queryset(self): 
        return Formateur.objects.all()
 