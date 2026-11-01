"""Vues API de l'application finance."""

from django.db.models import Count, Max, Q, Sum
from django.db.models.functions import Coalesce
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Fongo_Gestion.permissions import (
    IsCaissierOrSuperAdmin,
    IsStagiaire,
)
from fongo_user.models import User
from formation.models import Module

from .models import Ajout_Argent
from .serializers import (
    ModulePaiementSerializer,
    PaiementSerializer,
    StagiaireFinanceSerializer,
)


def is_finance_manager(user) -> bool:
    """Le super admin et les admins caissiers gèrent toute la finance."""
    if not (user and user.is_authenticated):
        return False
    if user.is_superuser or user.role == "super_admin":
        return True
    return bool(
        user.role == "admin"
        and "caissier" in (user.roles_supplementaires or [])
    )


class PaiementViewSet(viewsets.ModelViewSet):
    """CRUD des paiements.

    Un stagiaire ne voit que ses propres versements ; les admins voient tout.
    """

    serializer_class = PaiementSerializer
    queryset = Ajout_Argent.objects.select_related(
        "id_stagiaire", "module"
    ).order_by("-created_at")
    filterset_fields = ("category", "id_stagiaire", "module", "moyen", "statut")
    search_fields = (
        "description",
        "id_stagiaire__username",
        "id_stagiaire__last_name",
        "module__titre",
    )
    ordering_fields = ("created_at", "montant")

    def get_permissions(self):
        if self.action == "lumicash":
            return [IsStagiaire()]
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsCaissierOrSuperAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if is_finance_manager(user):
            return queryset
        return queryset.filter(id_stagiaire=user)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=["get"])
    def modules(self, request):
        """Modules du projet proposés dans les formulaires de paiement."""
        serializer = ModulePaiementSerializer(
            Module.objects.all(),
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def lumicash(self, request):
        """Déclare un paiement Lumicash en attente de validation."""
        payload = request.data.copy()
        payload["id_stagiaire"] = request.user.id
        payload["moyen"] = "lumicash"
        payload["statut"] = "en_attente"

        # Les anciens formulaires pouvaient envoyer 0 pour « aucun module ».
        if payload.get("module") in ("", 0, "0"):
            payload["module"] = None

        if not payload.get("description"):
            module = None
            module_id = payload.get("module")
            if module_id:
                module = Module.objects.filter(pk=module_id).first()
            payload["description"] = (
                f"Paiement Lumicash - {module.titre}"
                if module
                else "Paiement Lumicash - Autre frais"
            )

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def students(self, request):
        """Liste des stagiaires avec total versé et dernier versement validé."""
        user = request.user
        queryset = User.objects.filter(role="stagiaire")
        if not is_finance_manager(user):
            queryset = queryset.filter(id=user.id)

        paiements_valides = Q(ajout_argent_stagiaire__statut="valide")
        queryset = queryset.annotate(
            total_paye=Coalesce(
                Sum(
                    "ajout_argent_stagiaire__montant",
                    filter=paiements_valides,
                ),
                0,
            ),
            dernier_paiement=Max(
                "ajout_argent_stagiaire__created_at",
                filter=paiements_valides,
            ),
        ).order_by("-total_paye", "last_name")
        serializer = StagiaireFinanceSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Statistiques globales utilisées par le tableau de bord."""
        # Les demandes Lumicash en attente ou refusées ne sont pas encaissées.
        queryset = self.get_queryset().filter(statut="valide")
        total = queryset.aggregate(total=Coalesce(Sum("montant"), 0))["total"]
        # On retire le tri de la vue : sinon created_at entre dans le GROUP BY
        # et une même catégorie peut apparaître plusieurs fois.
        par_categorie = list(
            queryset.order_by()
            .values("category")
            .annotate(total=Sum("montant"), nombre=Count("id"))
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
        paiements = Ajout_Argent.objects.filter(statut="valide")
        if not is_finance_manager(user):
            paiements = paiements.filter(id_stagiaire=user)
        total = paiements.aggregate(total=Coalesce(Sum("montant"), 0))["total"]
        return Response(
            {
                "total_collecte": total,
                "nombre_paiements": paiements.count(),
                "nombre_stagiaires": User.objects.filter(role="stagiaire").count(),
            }
        )
