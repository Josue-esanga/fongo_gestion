from django.shortcuts import render
from django.views.generic import CreateView, ListView, TemplateView, DeleteView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Event
from .forms import EventForm
# Create your views here.

class AddEventView(LoginRequiredMixin, CreateView):
    model = Event
    form_class = EventForm
    template_name = 'add_event.html'
    success_url = reverse_lazy('list_event')

class ListEventView(LoginRequiredMixin, ListView):
    model = Event
    template_name = 'list_event.html'
    context_object_name = 'events'

class UpdateEventView(LoginRequiredMixin, UpdateView):
    model = Event
    form_class = EventForm
    template_name = 'add_event.html'
    success_url = reverse_lazy('list_event')

class DeleteEventView(LoginRequiredMixin, DeleteView):
    model = Event
    template_name = 'delete_event.html'
    success_url = reverse_lazy('list_event')


