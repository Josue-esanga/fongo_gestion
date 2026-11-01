"""Vues API de l'application paramètres + endpoints transverses."""

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from Fongo_Gestion.permissions import IsAdminOrSuperAdmin
from Planning.models import Event
from annonce.models import Annonce
from devoir.models import Devoir
from finance.models import Ajout_Argent
from fongo_user.models import User

from .models import Configuration
from .serializers import ConfigurationSerializer


class ConfigurationViewSet(viewsets.ModelViewSet):
    """Configuration générale du club (une seule ligne, créée à la demande)."""

    serializer_class = ConfigurationSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    queryset = Configuration.objects.all().order_by("id")

    def get_queryset(self):
        Configuration.objects.get_or_create(pk=1)
        return super().get_queryset()


class DashboardView(APIView):
    """GET /api/dashboard/ — compteurs et indicateurs du tableau de bord."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        user = request.user
        is_admin = user.is_superuser or user.role in ("admin", "super_admin")

        paiements = Ajout_Argent.objects.all()
        if not is_admin:
            paiements = paiements.filter(id_stagiaire=user)

        total = paiements.aggregate(total=Coalesce(Sum("montant"), 0))["total"]

        annonces = Annonce.objects.select_related("auteur")
        if not is_admin:
            annonces = annonces.exclude(cible="admins")
        annonces = annonces.order_by("-poster_a")[:3]

        def image_url(image):
            return request.build_absolute_uri(image.url) if image else None

        data = {
            "utilisateur": {
                "id": user.id,
                "username": user.username,
                "full_name": user.get_full_name() or user.username,
                "role": user.role,
                "pictures": request.build_absolute_uri(user.pictures.url)
                if user.pictures
                else None,
            },
            "finance": {
                "total_collecte": total,
                "nombre_paiements": paiements.count(),
            },
            "compteurs": {
                "membres": User.objects.count(),
                "stagiaires": User.objects.filter(role="stagiaire").count(),
                "formateurs": User.objects.filter(role="admin").count(),
            },
            "activite": {
                "annonces": Annonce.objects.count(),
                "devoirs": Devoir.objects.count(),
                "evenements": Event.objects.count(),
            },
            "dernieres_annonces": [
                {
                    "id": annonce.id,
                    "object": annonce.object,
                    "contenu": annonce.contenu,
                    "cible": annonce.cible,
                    "template": annonce.template,
                    "date_prevue": annonce.date_prevue,
                    "image1": image_url(annonce.image1),
                    "image2": image_url(annonce.image2),
                    "poster_a": annonce.poster_a,
                    "auteur__username": annonce.auteur.username,
                }
                for annonce in annonces
            ],
            "prochains_evenements": list(
                Event.objects.order_by("date").values(
                    "id", "title", "date", "dirigent__username"
                )[:3]
            ),
            "repartition_roles": list(
                User.objects.values("role").annotate(nombre=Count("id"))
            ),
        }
        return Response(data)
