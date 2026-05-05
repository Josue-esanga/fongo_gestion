from django.shortcuts import render,redirect,get_object_or_404

from django.contrib.auth import login
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy
from django.views.generic import ListView
from django.views.generic import TemplateView
from .models import *
from .forms import *
from django.contrib.auth import logout


def register(request):
    if request.method == "POST":
        form = UserForm(request.POST, request.FILES) # il y a request.FILES pour les images
        if form.is_valid():
            user = form.save()
            return redirect("list_member")
    else:
        form = UserForm()
    return render(request, 'add_user.html', {'form':form})


def modify_user(request, id):
    utilisateur = get_object_or_404(User, id = id)
    if request.method == 'POST':
        form = UserForm(request.POST, request.FILES, instance=utilisateur)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("list_member")
    else:
        form = UserForm(instance=utilisateur)
    return render(request, 'add_user.html', {'form':form})


def delete_user(request, id):
    utilisateur = get_object_or_404(User, id = id)
    if request.method == 'POST':
        utilisateur.delete()
        return redirect("list_member")
    return render(request, "delete.html", {'user': utilisateur})




#RegisterView
# class RegisterView(CreateView):
#     #Gère l'affichage du formulaire (GET) et la création de l'utilisateur (POST).
#     #Le traitement de request.FILES est géré automatiquement par Django.
#     template_name = 'add_user.html'
#     model = User
#     form_class = UserForm
#     success_url = reverse_lazy('list_member') # Redirige vers la page d'accueil après l'inscription réussie
    
#     def form_valid(self, form): # Enregistre l'utilisateur dans la base de données
#         user = form.save() # Enregistre l'utilisateur dans la base de données
#         login(self.request, user, backend='django.contrib.auth.backends.ModelBackend') # Pour gérer la session
#         return super().form_valid(form) # Redirige vers la page d'accueil après l'inscription réussie

class ListMember(LoginRequiredMixin,ListView):
    model = User
    template_name = 'list_member.html'
    context_object_name = 'users'
    def get_queryset(self): 
        return User.objects.all()


class ListStagiaire(LoginRequiredMixin,ListView):
    model = User
    template_name = 'list_member.html'
    context_object_name = 'users'
    def get_queryset(self):
        return User.objects.filter(role = 'stagiaire')
    
class ListAdmin(LoginRequiredMixin,ListView):
    model = User
    template_name = 'list_member.html'
    context_object_name = 'users'
    def get_queryset(self):
        return User.objects.filter(role = 'admin')
 

# class ListMember(TemplateView):
#     template_name = 'list_member.html'




class LoginView1(LoginView):
    template_name = 'login.html'
    def get_success_url(self):
        return reverse_lazy('Dashboard') # Redirige vers la page d'accueil après la connexion réussie



class Home(LoginRequiredMixin,TemplateView):
    template_name = 'home.html'
    # def get_context_data(self, **kwargs):
    #     context = super().get_context_data(**kwargs)
    #     context['user'] = self.request.user
    #     return context

class Dashboard(LoginRequiredMixin,TemplateView):
    template_name = 'base.html'


def logout_user(request):
    logout(request)
    return redirect('login')

# class Acceuil(LoginRequiredMixin,TemplateView):
#     template_name = "home.html"



