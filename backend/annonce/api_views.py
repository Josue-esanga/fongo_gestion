"""Vues API de l'application annonces."""

from pathlib import Path

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiTypes, extend_schema
from PIL import Image, UnidentifiedImageError
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Fongo_Gestion.permissions import IsSuperAdminOrCommunicationOrReadOnly

from .models import Annonce
from .serializers import AnnonceSerializer

# Capture de partage : PNG produit par le frontend, bornes raisonnables.
POSTER_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
POSTER_MAX_SIZE = 5 * 1024 * 1024  # 5 Mo


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


class AnnoncePosterView(APIView):
    """POST /api/annonces/<pk>/poster/ — enregistre la capture de partage.

    Le frontend capture la carte d'annonce **telle qu'affichée** (PNG) juste
    après l'enregistrement et l'envoie ici. Cette image sert ensuite de :

    - fichier téléchargé (« Télécharger l'image ») : identique au rendu posté,
      sans design ajouté ni retiré ;
    - image envoyée avec le partage WhatsApp / Facebook ;
    - aperçu ``og:image`` de la page publique ``/a/<id>/``.

    Écriture réservée aux mêmes comptes que l'édition d'une annonce
    (super administrateur ou rôle ``communication``).
    """

    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsSuperAdminOrCommunicationOrReadOnly]

    @extend_schema(
        request={"poster": OpenApiTypes.BINARY},
        responses={200: AnnonceSerializer},
    )
    def post(self, request, pk):
        annonce = get_object_or_404(Annonce, pk=pk)
        fichier = request.FILES.get("poster")

        if fichier is None:
            raise ValidationError({"poster": "Aucune image reçue."})

        extension = Path(fichier.name or "").suffix.lower()
        if extension not in POSTER_EXTENSIONS:
            raise ValidationError(
                {"poster": "Formats acceptés : PNG, JPEG ou WebP."}
            )
        if fichier.size > POSTER_MAX_SIZE:
            raise ValidationError(
                {"poster": "L'image dépasse la taille maximale de 5 Mo."}
            )

        # Le fichier doit être réellement une image lisible.
        try:
            with Image.open(fichier) as image:
                image.verify()
        except (UnidentifiedImageError, OSError) as cause:
            raise ValidationError(
                {"poster": "Ce fichier n'est pas une image valide."}
            ) from cause
        finally:
            fichier.seek(0)

        ancien = annonce.poster
        annonce.poster = fichier
        annonce.save(update_fields=["poster"])

        # Purge de l'ancienne capture remplacée par la nouvelle.
        if ancien and ancien.name and ancien.name != annonce.poster.name:
            ancien.delete(save=False)

        serializer = AnnonceSerializer(annonce, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
