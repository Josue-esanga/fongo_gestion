from django.urls import path
from . import views

urlpatterns = [
    path('annonce', views.Annonce1.as_view(), name="annonce"),
    path('add_annonce/', views.add_annonce, name='add_annonce'),
    path('modifier_annonce/<int:id>/', views.modifier_annonce, name='modifier_annonce'),
    path('supprimer_annonce/<int:id>/', views.delete, name='supprimer_annonce'),
    
]
