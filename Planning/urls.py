from django.urls import path
from . import views

urlpatterns = [
    path('add_event/', views.AddEventView.as_view(), name='add_event'),
    path('list_events/', views.ListEventView.as_view(), name='list_event'),
    path('update_event/<int:pk>/', views.UpdateEventView.as_view(), name='update_event'),
    path('delete_event/<int:pk>/', views.DeleteEventView.as_view(), name='delete_event'),
]
