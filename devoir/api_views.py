"""Vues API de l'application devoirs."""

from rest_framework import viewsets

from Fongo_Gestion.permissions import IsAdminOrReadOnly

from .models import Devoir
from .serializers import DevoirSerializer


class DevoirViewSet(viewsets.ModelViewSet):
    """CRUD des devoirs. Lecture pour tous, écriture pour les admins."""

    serializer_class = DevoirSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Devoir.objects.all().order_by("-created_at")
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "limit_date", "title")
