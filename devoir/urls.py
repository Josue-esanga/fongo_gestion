from django.urls import path
from . import views

urlpatterns = [
    path('list_devoirs/', views.ListDevoirView.as_view(), name='list_devoir'),
    path('add_devoir/', views.AddDevoirView.as_view(), name='add_devoir'),
    path('update_devoir/<int:pk>/', views.UpdateDevoir.as_view(), name='update_devoir'),
    path('delete_devoir/<int:pk>/', views.DeleteDevoir.as_view(), name='delete_devoir'),
]