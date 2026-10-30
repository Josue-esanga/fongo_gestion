"""Serializers de l'application présences."""

from rest_framework import serializers

from fongo_user.models import User
from fongo_user.serializers import UserCompactSerializer

from .models import Presence, SeancePresence
from .utils import JOURS_FR


class SeancePresenceSerializer(serializers.ModelSerializer):
    """Séance d'appel, avec compteurs présents / absents pour l'interface."""

    qr_payload = serializers.CharField(read_only=True)
    creee_par_nom = serializers.SerializerMethodField()
    jour_semaine = serializers.SerializerMethodField()
    total_stagiaires = serializers.SerializerMethodField()
    presents = serializers.SerializerMethodField()
    absents = serializers.SerializerMethodField()

    class Meta:
        model = SeancePresence
        fields = (
            "id",
            "libelle",
            "date",
            "jour_semaine",
            "ouverte",
            "qr_payload",
            "total_stagiaires",
            "presents",
            "absents",
            "creee_par_nom",
            "created_at",
        )
        read_only_fields = (
            "id",
            "date",
            "jour_semaine",
            "ouverte",
            "qr_payload",
            "total_stagiaires",
            "presents",
            "absents",
            "creee_par_nom",
            "created_at",
        )
        extra_kwargs = {
            "libelle": {"required": False, "allow_blank": True, "max_length": 200}
        }

    def get_jour_semaine(self, obj) -> str:
        """Jour de formation concerné, ex. « lundi » (classement par jour)."""
        return JOURS_FR[obj.date.weekday()]

    def _presents(self, obj) -> int:
        # Compteur pré-calculé par la vue (list), sinon calcul à la volée.
        annotated = getattr(obj, "presents_annotes", None)
        if annotated is not None:
            return annotated
        return obj.presences.count()

    def get_presents(self, obj) -> int:
        return self._presents(obj)

    def get_absents(self, obj) -> int:
        return max(self.get_total_stagiaires(obj) - self._presents(obj), 0)

    def get_total_stagiaires(self, obj) -> int:
        # Même valeur pour toutes les séances d'une requête : mis en cache.
        cache = self.context
        if "total_stagiaires" not in cache:
            cache["total_stagiaires"] = User.objects.filter(role="stagiaire").count()
        return cache["total_stagiaires"]

    def get_creee_par_nom(self, obj) -> str | None:
        if not obj.creee_par:
            return None
        return obj.creee_par.get_full_name() or obj.creee_par.username


class ParticipantPresenceSerializer(UserCompactSerializer):
    """Stagiaire d'une séance + son statut (présent / absent)."""

    present = serializers.SerializerMethodField()
    horodatage = serializers.SerializerMethodField()

    class Meta(UserCompactSerializer.Meta):
        fields = UserCompactSerializer.Meta.fields + ("present", "horodatage")
        read_only_fields = fields

    def get_present(self, obj) -> bool:
        return bool(getattr(obj, "_present", False))

    def get_horodatage(self, obj):
        return getattr(obj, "_horodatage", None)


class ScanPresenceSerializer(serializers.Serializer):
    """Code QR scanné par un stagiaire."""

    code = serializers.CharField(max_length=256)

    def validate_code(self, value):
        value = value.strip()
        # Tolère le contenu exact du QR (« FONGO-PRESENCE:<code> ») ou le code seul.
        if value.startswith("FONGO-PRESENCE:"):
            value = value.split(":", 1)[1].strip()
        if not value:
            raise serializers.ValidationError("Le code scanné est vide.")
        return value


class MaPresenceSerializer(serializers.Serializer):
    """Statut du jour pour le stagiaire connecté."""

    present = serializers.BooleanField()
    horodatage = serializers.DateTimeField(allow_null=True)
    appel_ouvert = serializers.BooleanField()
    libelle = serializers.CharField(allow_null=True)
