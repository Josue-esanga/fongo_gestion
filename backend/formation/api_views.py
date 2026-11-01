"""Vues API de l'application formation."""

from rest_framework import viewsets

from Fongo_Gestion.permissions import IsAdminOrReadOnly

from .models import Formateur, Module
from .serializers import FormateurSerializer, ModuleSerializer


class FormateurViewSet(viewsets.ModelViewSet):
    serializer_class = FormateurSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Formateur.objects.select_related("user").prefetch_related("modules")
    search_fields = ("user__username", "user__last_name", "matiere", "bio")
    filterset_fields = ("matiere",)


class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Module.objects.prefetch_related("formateurs__user")
    search_fields = ("titre", "description")
    filterset_fields = ("formateurs",)
    ordering = ("ordre", "id")
    ordering_fields = ("ordre", "titre", "duree")
