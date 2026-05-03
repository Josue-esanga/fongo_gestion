from django.urls import path
from . import views

urlpatterns = [
    path('add_annonce/', views.add_annonce, name='add_annonce'),
    path('annonce', views.Annonce.as_view(), name="annonce")
    
]
