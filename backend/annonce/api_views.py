"""Vues API de l'application annonces."""

from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Fongo_Gestion.permissions import IsSuperAdminOrCommunicationOrReadOnly

from .models import Annonce
from .serializers import AnnonceSerializer


class AnnonceViewSet(viewsets.ModelViewSet):
    """CRUD des annonces. Lecture pour tous, écriture pour les admins."""

    serializer_class = AnnonceSerializer
    permission_classes = [IsSuperAdminOrCommunicationOrReadOnly]
    queryset = Annonce.objects.select_related("auteur").order_by("-poster_a")
    search_fields = ("object", "contenu", "auteur__username")
    ordering_fields = ("poster_a", "object")

    def get_queryset(self):
        """Masque les annonces réservées aux admins aux autres comptes."""
        queryset = super().get_queryset()
        user = self.request.user
        is_admin = user.is_superuser or user.role in ("admin", "super_admin")
        if not is_admin:
            queryset = queryset.exclude(cible="admins")
        return queryset


class PublicAnnonceListView(APIView):
    """GET /api/annonces/public/ — annonces affichées sur la page d'accueil.

    Ouvert **sans connexion** : c'est ce qui permet d'afficher les annonces du
    club aux visiteurs non connectés de la page racine.

    - aucune authentification n'est tentée (`authentication_classes = []`) :
      un jeton expiré ne peut donc jamais faire échouer l'affichage public ;
    - les annonces réservées aux administrateurs ne sont jamais renvoyées ;
    - les 20 annonces les plus récentes, les plus récentes d'abord.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(responses=AnnonceSerializer(many=True))
    def get(self, request):
        annonces = (
            Annonce.objects.select_related("auteur")
            .exclude(cible="admins")
            .order_by("-poster_a")[:20]
        )
        serializer = AnnonceSerializer(
            annonces, many=True, context={"request": request}
        )
        return Response(serializer.data)
