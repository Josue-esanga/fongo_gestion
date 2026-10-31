"""Vues API de l'application formation."""

from rest_framework import viewsets

from Fongo_Gestion.permissions import IsAdminOrReadOnly

from .models import Formateur, Module
from .serializers import FormateurSerializer, ModuleSerializer


class FormateurViewSet(viewsets.ModelViewSet):
    serializer_class = FormateurSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Formateur.objects.select_related("user").prefetch_related("module_set")
    search_fields = ("user__username", "user__last_name", "matiere", "bio")
    filterset_fields = ("matiere",)


class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Module.objects.select_related("id_formateur__user")
    search_fields = ("cours",)
    filterset_fields = ("id_formateur",)
