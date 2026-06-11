from django.shortcuts import render
from django.views.generic import CreateView, ListView, TemplateView, DeleteView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Devoir
from .forms import DevoirForm

# Create your views here.

class AddDevoirView(LoginRequiredMixin, CreateView):
    model = Devoir
    form_class = DevoirForm
    template_name = 'add_devoir.html'
    success_url = reverse_lazy('list_devoir')

class ListDevoirView(LoginRequiredMixin, ListView):
    model = Devoir
    template_name = 'list_devoir.html'
    context_object_name = 'devoirs'

class UpdateDevoir(LoginRequiredMixin, UpdateView):
    model = Devoir
    form_class = DevoirForm
    template_name = 'add_devoir.html'
    success_url = reverse_lazy('list_devoir')

class DeleteDevoir(LoginRequiredMixin, DeleteView):
    model = Devoir
    template_name = 'delete_devoir.html'
    success_url = reverse_lazy('list_devoir')
