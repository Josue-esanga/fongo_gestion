from django.urls import path
from . import views

urlpatterns = [
    path('ajout_argent/', views.AjoutArgentView.as_view(), name='ajout_argent'),
    path('list_paiement/', views.ListPaiementView.as_view(), name='list_paiement'),
    path('list_tous_les_stagiaires/', views.ListeTousLesStagiairesView.as_view(), name='list_tous_les_stagiaires'),
]