from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib.auth.views import PasswordChangeView
from django.views.generic import UpdateView
from django.urls import reverse_lazy
from fongo_user.models import User
from .forms import UserProfileForm

class ParametresProfilView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = User
    form_class = UserProfileForm
    template_name = 'profil.html'
    success_url = reverse_lazy('parametres_profil')
    success_message = "Votre profil a été mis à jour avec succès !"

    
    def get_object(self, queryset=None):
        return self.request.user

    #données supplémentaires au template
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['onglet_actif'] = 'profil'
        return context


class ParametresSecuriteView(LoginRequiredMixin, SuccessMessageMixin, PasswordChangeView):
    template_name = 'securite.html'
    success_url = reverse_lazy('parametres_securite')
    success_message = "Votre mot de passe a été modifié avec succès !"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['onglet_actif'] = 'securite'
        return context