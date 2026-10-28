"""Vues API de l'application annonces."""

from rest_framework import viewsets

from Fongo_Gestion.permissions import IsAdminOrReadOnly

from .models import Annonce
from .serializers import AnnonceSerializer


class AnnonceViewSet(viewsets.ModelViewSet):
    """CRUD des annonces. Lecture pour tous, écriture pour les admins."""

    serializer_class = AnnonceSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Annonce.objects.select_related("auteur").order_by("-poster_a")
    search_fields = ("object", "contenu", "auteur__username")
    ordering_fields = ("poster_a", "object")
