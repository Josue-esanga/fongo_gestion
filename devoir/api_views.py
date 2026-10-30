"""Vues API de l'application devoirs."""

from rest_framework import viewsets

from Fongo_Gestion.permissions import IsDevoirEditor

from .models import Devoir
from .serializers import DevoirSerializer


class DevoirViewSet(viewsets.ModelViewSet):
    """CRUD des devoirs.

    Lecture pour tous les utilisateurs authentifiés, écriture pour le super
    administrateur et les administrateurs portant le rôle « formateur ».
    """

    serializer_class = DevoirSerializer
    permission_classes = [IsDevoirEditor]
    queryset = Devoir.objects.all().order_by("-created_at")
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "limit_date", "title")
