from django.shortcuts import render , redirect
from . forms import *
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView
# Create your views here.
   

class Annonce(LoginRequiredMixin, ListView):
    model = Annonce 
    template_name = 'annonce.html'
    context_object_name = "annonces"


def add_annonce(request):
    if request.method == "POST":
        form = AnnonceForm(request.POST) # il y a request.FILES pour les images
        if form.is_valid():
            form.save()
            return redirect("annonce")
    else:
        form = AnnonceForm()
    return render(request, 'annonce_form.html', {'ann':form})
