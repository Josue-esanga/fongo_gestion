"""Vues API de l'application utilisateurs."""

from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from Fongo_Gestion.permissions import IsMemberViewer, IsSuperAdmin
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema

from .serializers import (
    ChangePasswordSerializer,
    FongoTokenObtainPairSerializer,
    ProfileSerializer,
    UserSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST /api/auth/token/ — connexion et obtention des jetons JWT."""

    serializer_class = FongoTokenObtainPairSerializer


class MeView(RetrieveUpdateAPIView):
    """GET / PATCH /api/auth/me/ — profil de l'utilisateur connecté."""

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — changement de mot de passe."""

    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    @extend_schema(request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Votre mot de passe a été modifié avec succès."},
            status=status.HTTP_200_OK,
        )


class UserViewSet(viewsets.ModelViewSet):
    """CRUD des utilisateurs.

    - Lecture : tous les utilisateurs sauf les stagiaires ;
    - Écriture / suppression / rôles : super administrateur uniquement ;
    - `?role=stagiaire|admin|super_admin` filtre par rôle ;
    - `?search=` recherche par nom / prénom / email / username.
    """

    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("username")
    filterset_fields = ("role", "is_active")
    search_fields = ("username", "first_name", "last_name", "email")
    ordering_fields = ("username", "date_joined", "role")

    def get_permissions(self):
        # Lecture des profils : réservée aux administrateurs (hors stagiaires).
        if self.action in ("list", "retrieve", "stagiaires", "admins"):
            return [IsMemberViewer()]
        # Écriture / suppression / rôles : super administrateur uniquement.
        if self.action in ("create", "update", "partial_update", "destroy", "bulk_create"):
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def stagiaires(self, request):
        queryset = self.filter_queryset(self.get_queryset().filter(role="stagiaire"))
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def admins(self, request):
        queryset = self.filter_queryset(self.get_queryset().filter(role="admin"))
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
