"""Vues API de l'application finance."""

from django.db.models import Count, Max, Sum
from django.db.models.functions import Coalesce
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from Fongo_Gestion.permissions import IsFinanceEditor, has_extra_role
from fongo_user.models import User

from .models import Ajout_Argent
from .serializers import PaiementSerializer, StagiaireFinanceSerializer


class PaiementViewSet(viewsets.ModelViewSet):
    """CRUD des paiements.

    Un stagiaire ne voit que ses propres versements ; le super administrateur
    et les administrateurs portant le rôle « caissier » voient tout.
    """

    serializer_class = PaiementSerializer
    queryset = Ajout_Argent.objects.select_related("id_stagiaire").order_by("-created_at")
    filterset_fields = ("category", "id_stagiaire")
    search_fields = ("description", "id_stagiaire__username", "id_stagiaire__last_name")
    ordering_fields = ("created_at", "montant")

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsFinanceEditor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if has_extra_role(user, "caissier"):
            return queryset
        return queryset.filter(id_stagiaire=user)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=["get"])
    def students(self, request):
        """Liste des stagiaires avec total versé et dernier versement."""
        user = request.user
        queryset = User.objects.filter(role="stagiaire")
        if not has_extra_role(user, "caissier"):
            queryset = queryset.filter(id=user.id)
        queryset = queryset.annotate(
            total_paye=Coalesce(Sum("ajout_argent_stagiaire__montant"), 0),
            dernier_paiement=Max("ajout_argent_stagiaire__created_at"),
        ).order_by("-total_paye", "last_name")
        serializer = StagiaireFinanceSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Statistiques globales utilisées par le tableau de bord."""
        queryset = self.get_queryset()
        total = queryset.aggregate(total=Coalesce(Sum("montant"), 0))["total"]
        par_categorie = list(
            queryset.values("category").annotate(total=Sum("montant"), nombre=Count("id"))
        )
        nb_stagiaires = User.objects.filter(role="stagiaire").count()
        return Response(
            {
                "total_collecte": total,
                "nombre_paiements": queryset.count(),
                "nombre_stagiaires": nb_stagiaires,
                "par_categorie": par_categorie,
            }
        )


class FinanceStatsView(APIView):
    """GET /api/finance/overview/ — synthèse rapide pour le dashboard."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        user = request.user
        paiements = Ajout_Argent.objects.all()
        if not has_extra_role(user, "caissier"):
            paiements = paiements.filter(id_stagiaire=user)
        total = paiements.aggregate(total=Coalesce(Sum("montant"), 0))["total"]
        return Response(
            {
                "total_collecte": total,
                "nombre_paiements": paiements.count(),
                "nombre_stagiaires": User.objects.filter(role="stagiaire").count(),
            }
        )
