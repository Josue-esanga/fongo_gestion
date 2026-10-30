"""Vues API de l'application présences (QR code d'appel)."""

from datetime import date as date_cls

from django.db.models import Count
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.response import Response

from Fongo_Gestion.permissions import IsNonStagiaire, IsStagiaire, IsSuperAdmin
from fongo_user.models import User

from . import utils
from .models import Presence, SeancePresence
from .serializers import (
    MaPresenceSerializer,
    ParticipantPresenceSerializer,
    ScanPresenceSerializer,
    SeancePresenceSerializer,
)


class SeancePresenceViewSet(viewsets.ModelViewSet):
    """Séances d'appel rattachées à un QR code (accès hors stagiaires).

    - Liste / détail / démarrage / clôture d'un appel : tous les utilisateurs
      sauf les stagiaires ;
    - suppression : super administrateur uniquement ;
    - à la création, toute séance encore ouverte est clôturée : l'ancien QR
      code affiché en salle devient alors invalide ;
    - la formation a lieu du lundi au vendredi : le démarrage d'un appel le
      week-end est refusé ;
    - la liste se classe par jour, filtrable via ``?jour=AAAA-MM-JJ``.
    """

    serializer_class = SeancePresenceSerializer
    # order_by explicite : garantit une pagination stable (et silencieuse)
    # même avec l'annotation de comptage.
    queryset = (
        SeancePresence.objects.select_related("creee_par")
        .annotate(presents_annotes=Count("presences", distinct=True))
        .order_by("-created_at", "-id")
        .distinct()
    )
    search_fields = ("libelle",)

    def get_permissions(self):
        if self.action == "destroy":
            return [IsSuperAdmin()]
        return [IsNonStagiaire()]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Classement par jour : ?jour=AAAA-MM-JJ ne retourne que ce jour-là.
        jour = self.request.query_params.get("jour")
        if jour:
            try:
                date_jour = date_cls.fromisoformat(str(jour))
            except ValueError:
                raise ValidationError(
                    {"detail": "Paramètre « jour » invalide (format attendu : AAAA-MM-JJ)."}
                )
            queryset = queryset.filter(date=date_jour)
        return queryset

    def perform_create(self, serializer):
        # Règle du lundi au vendredi : pas d'appel le week-end.
        if not utils.est_jour_formation():
            raise ValidationError({"detail": utils.message_hors_formation()})
        # Un nouveau appel invalide les QR codes précédemment affichés.
        SeancePresence.objects.filter(ouverte=True).update(ouverte=False)
        libelle = (serializer.validated_data.get("libelle") or "").strip()
        if not libelle:
            libelle = f"Appel du {timezone.localtime().strftime('%d/%m/%Y %H:%M')}"
        serializer.save(
            libelle=libelle,
            creee_par=self.request.user,
            date=utils.date_du_jour(),
        )

    @action(detail=True, methods=["post"])
    def fermer(self, request, pk=None):
        """Clôture l'appel : les scans suivants sont refusés."""
        seance = self.get_object()
        if seance.ouverte:
            seance.ouverte = False
            seance.save(update_fields=["ouverte"])
        return Response(self.get_serializer(seance).data)

    @action(detail=True, methods=["get"])
    def participants(self, request, pk=None):
        """Tous les stagiaires de la séance, avec statut présent / absent."""
        seance = self.get_object()
        presences = {p.stagiaire_id: p for p in seance.presences.all()}
        stagiaires = User.objects.filter(role="stagiaire").order_by(
            "last_name", "first_name", "username"
        )

        data = []
        for stagiaire in stagiaires:
            presence = presences.get(stagiaire.id)
            stagiaire._present = presence is not None
            stagiaire._horodatage = presence.horodatage if presence else None
            data.append(stagiaire)

        serializer = ParticipantPresenceSerializer(
            data, many=True, context={"request": request}
        )
        return Response(serializer.data)


class ScannerPresenceView(CreateAPIView):
    """Enregistre la présence du stagiaire connecté (scan du QR code)."""

    serializer_class = ScanPresenceSerializer
    permission_classes = [IsStagiaire]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]

        # Règle du lundi au vendredi : le QR code n'est pas fonctionnel le
        # week-end, même si un appel est resté ouvert depuis le vendredi.
        if not utils.est_jour_formation():
            return Response(
                {"detail": utils.message_hors_formation()},
                status=status.HTTP_400_BAD_REQUEST,
            )

        seance = SeancePresence.objects.filter(code=code, ouverte=True).first()
        if seance is None:
            return Response(
                {"detail": "QR code inconnu ou appel clôturé. Demandez le code affiché en salle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        presence, created = Presence.objects.get_or_create(
            seance=seance, stagiaire=request.user
        )
        payload = {
            "present": True,
            "horodatage": presence.horodatage,
            "appel_ouvert": True,
            "libelle": seance.libelle,
        }
        data = {**MaPresenceSerializer(payload).data, "deja_enregistre": not created}
        return Response(
            data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MaPresenceView(RetrieveAPIView):
    """Statut du jour du stagiaire connecté (présent / absent)."""

    serializer_class = MaPresenceSerializer
    permission_classes = [IsStagiaire]

    def retrieve(self, request, *args, **kwargs):
        today = utils.date_du_jour()
        seance_ouverte = SeancePresence.objects.filter(ouverte=True).first()
        presence = (
            Presence.objects.filter(stagiaire=request.user, seance__date=today)
            .order_by("-horodatage")
            .first()
        )
        if presence:
            libelle = presence.seance.libelle
        elif seance_ouverte:
            libelle = seance_ouverte.libelle
        else:
            libelle = None

        payload = {
            "present": presence is not None,
            "horodatage": presence.horodatage if presence else None,
            # Week-end : même si un appel est resté ouvert, aucun scan n'est
            # accepté → l'interface stagiaire affiche « aucun appel en cours ».
            "appel_ouvert": seance_ouverte is not None and utils.est_jour_formation(),
            "libelle": libelle,
        }
        return Response(MaPresenceSerializer(payload).data)
