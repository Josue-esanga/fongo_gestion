"""Vues API de l'application formation."""

from rest_framework import viewsets

from Fongo_Gestion.permissions import IsProgrammeAccess, IsSuperAdminOrReadOnly

from .models import Formateur, Module, ModulePedagogique
from .serializers import (
    FormateurSerializer,
    ModulePedagogiqueSerializer,
    ModuleSerializer,
)


class FormateurViewSet(viewsets.ModelViewSet):
    serializer_class = FormateurSerializer
    permission_classes = [IsSuperAdminOrReadOnly]
    queryset = Formateur.objects.select_related("user").prefetch_related("module_set")
    search_fields = ("user__username", "user__last_name", "matiere", "bio")
    filterset_fields = ("matiere",)


class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [IsSuperAdminOrReadOnly]
    queryset = Module.objects.select_related("id_formateur__user")
    search_fields = ("cours",)
    filterset_fields = ("id_formateur",)


class ModulePedagogiqueViewSet(viewsets.ModelViewSet):
    """Grille des modules affichée dans l'option « Modules ».

    Lecture pour tous les utilisateurs sauf les stagiaires, écriture réservée
    au super administrateur.
    """

    serializer_class = ModulePedagogiqueSerializer
    permission_classes = [IsProgrammeAccess]
    queryset = ModulePedagogique.objects.all()
    search_fields = ("titre",)
    ordering_fields = ("ordre", "titre")
