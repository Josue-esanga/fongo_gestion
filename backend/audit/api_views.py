"""Vues API de l'application audit (réservées au super administrateur)."""

from datetime import datetime, time, timedelta

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from Fongo_Gestion.permissions import IsSuperAdmin

from .models import AuditLog
from .serializers import AuditLogSerializer
from .signals import tracked_models

# Fenêtres utilisées par la page d'audit.
PERIOD_DAYS = 14
ACTIVE_USER_WINDOW_DAYS = 30


class AuditPagination(PageNumberPagination):
    """Journal paginé léger (le front affine ensuite côté client)."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/audit/logs/ — journal d'activité, en lecture seule.

    Filtres : `?action=`, `?model_label=`, `?user=<id>` ; recherche
    `?search=` sur l'auteur, la ressource et l'objet.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]
    pagination_class = AuditPagination
    queryset = AuditLog.objects.select_related("user").order_by("-created_at")
    filterset_fields = ("action", "model_label", "user")
    search_fields = ("username", "object_repr", "model_label", "user__username")
    ordering_fields = ("created_at",)


class AuditSummaryView(APIView):
    """GET /api/audit/summary/ — statistiques de l'audit pour la page."""

    permission_classes = [IsSuperAdmin]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        now = timezone.now()
        today = now.date()
        logs = AuditLog.objects.all()

        # Totaux
        totals = {
            "events": logs.count(),
            "today": logs.filter(created_at__date=today).count(),
            "week": logs.filter(created_at__gte=now - timedelta(days=7)).count(),
            "users": logs.filter(user__isnull=False)
            .values("user")
            .distinct()
            .count(),
        }

        # Répartition par type d'action (les choix sans entrée restent à 0).
        by_action = {code: 0 for code, _ in AuditLog.ACTION_CHOICES}
        by_action.update(
            {
                row["action"]: row["nombre"]
                for row in logs.values("action").annotate(nombre=Count("id"))
            }
        )

        # Sections les plus touchées
        by_model = [
            {"model_label": row["model_label"], "count": row["nombre"]}
            for row in logs.exclude(model_label="")
            .values("model_label")
            .annotate(nombre=Count("id"))
            .order_by("-nombre")[:8]
        ]

        # Les comptes les plus actifs sur les 30 derniers jours
        top_users = [
            {"user": row["user"], "username": row["username"], "count": row["nombre"]}
            for row in logs.filter(
                user__isnull=False,
                created_at__gte=now - timedelta(days=ACTIVE_USER_WINDOW_DAYS),
            )
            .values("user", "username")
            .annotate(nombre=Count("id"))
            .order_by("-nombre", "username")[:8]
        ]

        # Activité jour par jour sur la période (jours vides complétés à 0)
        start = datetime.combine(
            today - timedelta(days=PERIOD_DAYS - 1),
            time.min,
            tzinfo=timezone.get_current_timezone(),
        )
        rows = {
            row["jour"]: row["nombre"]
            for row in logs.filter(created_at__gte=start)
            .annotate(jour=TruncDate("created_at"))
            .values("jour")
            .annotate(nombre=Count("id"))
        }
        daily = []
        for offset in range(PERIOD_DAYS):
            day = (today - timedelta(days=PERIOD_DAYS - 1)) + timedelta(days=offset)
            daily.append({"date": day.isoformat(), "count": rows.get(day, 0)})

        # Modèles suivis automatiquement (transparence : ce que l'audit couvre)
        tracked = [
            {
                "label": f"{model._meta.app_label}.{model._meta.model_name}",
                "name": str(model._meta.verbose_name),
            }
            for model in tracked_models()
        ]
        tracked.sort(key=lambda item: item["label"])

        return Response(
            {
                "totals": totals,
                "by_action": [
                    {"action": code, "label": label, "count": by_action.get(code, 0)}
                    for code, label in AuditLog.ACTION_CHOICES
                ],
                "by_model": by_model,
                "top_users": top_users,
                "daily": daily,
                "tracked_models": tracked,
            }
        )
