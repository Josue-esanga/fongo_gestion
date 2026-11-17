"""Vues API de l'application devoirs."""

from rest_framework import viewsets

from Fongo_Gestion.permissions import IsSuperAdminOrFormateurOrReadOnly

from .models import devoirs_visibles
from .serializers import DevoirSerializer


class DevoirViewSet(viewsets.ModelViewSet):
    """CRUD des devoirs. Lecture pour tous, écriture pour les admins.

    Le queryset est filtré côté serveur : un stagiaire ne reçoit que les
    devoirs « tous » et ceux ciblant ses rôles supplémentaires
    (frontend / backend).
    """

    serializer_class = DevoirSerializer
    permission_classes = [IsSuperAdminOrFormateurOrReadOnly]
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "limit_date", "title")

    def get_queryset(self):
        return devoirs_visibles(self.request.user).order_by("-created_at")
