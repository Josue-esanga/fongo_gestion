from django.urls import path
from .import views

urlpatterns = [
    path('assign/', views.NommerFormateur.as_view(), name="NommerFormateur")
]
