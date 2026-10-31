"""Routes de l'API REST FongoGestion (version 1).

Toutes les routes sont préfixées par ``/api/`` (voir ``Fongo_Gestion/urls.py``).
"""

from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from Planning.api_views import EventViewSet
from annonce.api_views import AnnonceViewSet
from devoir.api_views import DevoirViewSet
from finance.api_views import FinanceStatsView, PaiementViewSet
from formation.api_views import FormateurViewSet, ModuleViewSet
from fongo_user.api_views import (
    ChangePasswordView,
    LoginView,
    MeView,
    UserViewSet,
)
from parametre.api_views import ConfigurationViewSet, DashboardView

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("annonces", AnnonceViewSet, basename="annonce")
router.register("devoirs", DevoirViewSet, basename="devoir")
router.register("planning/events", EventViewSet, basename="event")
router.register("finance/paiements", PaiementViewSet, basename="paiement")
router.register("formation/formateurs", FormateurViewSet, basename="formateur")
router.register("formation/modules", ModuleViewSet, basename="module")
router.register("parametre/configuration", ConfigurationViewSet, basename="configuration")

urlpatterns = [
    # --- Authentification JWT ---
    path("auth/token/", LoginView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="auth_me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    # --- Endpoints transverses ---
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("finance/overview/", FinanceStatsView.as_view(), name="finance_overview"),
    path(
        "finance/students/",
        PaiementViewSet.as_view({"get": "students"}),
        name="finance_students",
    ),
    # --- Documentation OpenAPI / Swagger ---
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    # --- Routes générées par le routeur ---
    path("", include(router.urls)),
]
