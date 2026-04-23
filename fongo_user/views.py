# from django.shortcuts import render, redirect
from .forms import UserRegistrationForm
from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView

# def register(request):
#     if request.method == "POST":
#         form = UserRegistrationForm(request.POST, request.FILES) # il y a request.FILES pour les images
#         if form.is_valid():
#             user = form.save()
#             login(request, user) # Pour gérer la session
#             return redirect("templates") 
#     else:
#         form = UserRegistrationForm()
#     return render(request, 'register.html', {'form':form})


#RegisterView
class RegisterView(CreateView):
    #Gère l'affichage du formulaire (GET) et la création de l'utilisateur (POST).
    #Le traitement de request.FILES est géré automatiquement par Django.
    template_name = 'register.html'
    form_class = UserRegistrationForm
    success_url = reverse_lazy('home') # Redirige vers la page d'accueil après l'inscription réussie
    
    def form_valid(self, form):
        response = super().form_valid(form)
        user = self.get_object()
        login(self.request, user) # Pour gérer la session
        return response

class LoginView(LoginView):
    template_name = 'login.html'
    def get_success_url(self):
        return reverse_lazy('home') # Redirige vers la page d'accueil après la connexion réussie



