"""Vues API de l'application planning."""

from rest_framework import viewsets

from Fongo_Gestion.permissions import IsSuperAdminOrReadOnly

from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    """CRUD des événements. Lecture pour tous, écriture pour le super admin."""

    serializer_class = EventSerializer
    permission_classes = [IsSuperAdminOrReadOnly]
    queryset = Event.objects.select_related("dirigent").order_by("-date")
    search_fields = ("title", "description", "dirigent__username")
    ordering_fields = ("date", "created_at", "title")
