from django.shortcuts import get_object_or_404, render , redirect
from . forms import *
from . models import *
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView
# Create your views here.
   

class Annonce1(LoginRequiredMixin, ListView):
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


def modifier_annonce(request, id):
    annonce = get_object_or_404(Annonce , id=id)
    if request.method == "POST":
        form = AnnonceForm(request.POST, instance = annonce) # il y a request.FILES pour les images
        if form.is_valid():
            form.save()
            return redirect("annonce")
    else:
        form = AnnonceForm(instance = annonce)
    return render(request, 'annonce_form.html', {'ann':form})


def delete (request, id):
    annonce = get_object_or_404(Annonce , id=id)
    if request.method == "POST":
        annonce.delete()
        return redirect("annonce")
    return render(request, 'suppression_annonce.html', {'ann':annonce})
