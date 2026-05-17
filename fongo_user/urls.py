from django.urls import path
from . import views




urlpatterns = [
    path('', views.Home.as_view(), name='home'),
    path('login/', views.LoginView1.as_view(), name='login'),
    path('dashboard/', views.Dashboard.as_view(), name='Dashboard'),
    path('add_user/', views.register, name='add_user'),
    path('modify_user/<int:id>/', views.modify_user, name='modify_user'),
    path('delete_user/<int:id>/', views.delete_user, name='delete_user'),
    path('list_stagiaire/', views.ListStagiaire.as_view(), name='list_stagiaire'),
    path('list_admin/', views.ListAdmin.as_view(), name='list_admin'),
    path('list_member/', views.ListMember.as_view(), name='list_member'),
    path('deconnexion/', views.logout_user, name='logout'),
    # path('Acceuil/',views.Acceuil.as_view(),name='acceuil')
    
]
