from django.urls import path
from . import views

urlpatterns = [
    path('', views.LoginView1.as_view(), name='login'),
    path('home/', views.Home.as_view(), name='home'),
    path('register/', views.RegisterView.as_view(), name='register'),
    
]
