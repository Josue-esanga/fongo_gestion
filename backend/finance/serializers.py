"""Serializers de l'application finance."""

from rest_framework import serializers

from fongo_user.serializers import UserCompactSerializer
from fongo_user.models import User

from .models import Ajout_Argent


class PaiementSerializer(serializers.ModelSerializer):
    stagiaire = UserCompactSerializer(source="id_stagiaire", read_only=True)
    id_stagiaire = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="stagiaire"),
        write_only=True,
    )

    class Meta:
        model = Ajout_Argent
        fields = (
            "id",
            "montant",
            "category",
            "description",
            "created_at",
            "id_stagiaire",
            "stagiaire",
        )
        read_only_fields = ("id", "created_at")

    def validate_montant(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à zéro.")
        return value


class StagiaireFinanceSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    total_paye = serializers.IntegerField(read_only=True, default=0)
    dernier_paiement = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "pictures",
            "total_paye",
            "dernier_paiement",
        )

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
