from django.shortcuts import render
from django.views.generic import CreateView, ListView, TemplateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.db.models import Sum, Max
from fongo_user.models import User

from .forms import AjoutArgentForm
from .models import Ajout_Argent

# Create your views here.
class AjoutArgentView(LoginRequiredMixin, CreateView):
    model = Ajout_Argent
    form_class = AjoutArgentForm
    template_name = 'ajout_argent.html'
    success_url = reverse_lazy('list_paiement')

    # def form_valid(self, form):
    #     form.instance.id_stagiaire = self.request.user
    #     return super().form_valid(form)

class ListPaiementView(LoginRequiredMixin, ListView):
    model = Ajout_Argent
    template_name = 'list_paiement.html'
    context_object_name = 'paiements'

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'super_admin':
           return Ajout_Argent.objects.all().order_by('-created_at')
        else:
            return Ajout_Argent.objects.filter(id_stagiaire=user).order_by('-created_at')
            

class ListeTousLesStagiairesView(LoginRequiredMixin, ListView):
    model = User
    template_name = 'list_tous_les_stagiaires.html' 
    context_object_name = 'stagiaires'

    def get_queryset(self):
        user = self.request.user
        
        if user.role == "admin" or user.role == "super_admin" :

            return User.objects.filter(role="stagiaire").annotate(
               total_paye = Sum('ajout_argent_stagiaire__montant'),
               dernier_paiement = Max('ajout_argent_stagiaire__created_at')
        ).distinct().order_by('-total_paye')

        else :
            return User.objects.filter(id=user.id).annotate(
               total_paye = Sum('ajout_argent_stagiaire__montant'),
               dernier_paiement = Max('ajout_argent_stagiaire__created_at')
        )