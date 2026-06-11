from django.urls import path
from . import views

urlpatterns = [
    path('profil/', views.ParametresProfilView.as_view(), name='parametres_profil'),
    path('securite/', views.ParametresSecuriteView.as_view(), name='parametres_securite'),
]