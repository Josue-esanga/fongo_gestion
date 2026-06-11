from django.urls import path
from .import views

urlpatterns = [
    path('assign/', views.NommerFormateur.as_view(), name="NommerFormateur"),
    path('list_formateurs/', views.List_formateurs.as_view(), name="list_formateurs"),
    path('supprimer_formateur/<int:pk>/', views.DeleteFormateur.as_view(), name='supprimer_formateur'),
]
