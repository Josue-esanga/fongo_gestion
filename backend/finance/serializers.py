"""Serializers de l'application finance."""

from rest_framework import serializers

from fongo_user.models import User
from fongo_user.serializers import UserCompactSerializer
from formation.models import Module

from .models import Ajout_Argent


class ModulePaiementSerializer(serializers.ModelSerializer):
    """Module proposé dans les formulaires de paiement (caissier / Lumicash)."""

    image = serializers.ImageField(read_only=True)

    class Meta:
        model = Module
        fields = ("id", "titre", "duree", "ordre", "image")


class PaiementSerializer(serializers.ModelSerializer):
    stagiaire = UserCompactSerializer(source="id_stagiaire", read_only=True)
    id_stagiaire = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="stagiaire"),
        write_only=True,
    )
    module = serializers.PrimaryKeyRelatedField(
        queryset=Module.objects.all(),
        required=False,
        allow_null=True,
    )
    module_titre = serializers.SerializerMethodField()
    moyen_display = serializers.CharField(
        source="get_moyen_display", read_only=True
    )
    statut_display = serializers.CharField(
        source="get_statut_display", read_only=True
    )

    class Meta:
        model = Ajout_Argent
        fields = (
            "id",
            "montant",
            "category",
            "module",
            "module_titre",
            "moyen",
            "moyen_display",
            "statut",
            "statut_display",
            "description",
            "created_at",
            "id_stagiaire",
            "stagiaire",
        )
        read_only_fields = ("id", "created_at")

    def get_module_titre(self, obj) -> str | None:
        return obj.module.titre if obj.module_id else None

    def validate_montant(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à zéro.")
        return value

    def validate(self, attrs):
        module_supplied = "module" in attrs
        category_supplied = "category" in attrs
        module = attrs.get("module", getattr(self.instance, "module", None))
        category = attrs.get("category", getattr(self.instance, "category", None))

        # Un module implique forcément la catégorie « module ».
        if module_supplied and category_supplied:
            if module is not None and category != "module":
                raise serializers.ValidationError(
                    {"category": "Choisissez la catégorie « Module de formation »."}
                )
            if module is None and category == "module":
                raise serializers.ValidationError(
                    {"module": "Sélectionnez un module pour ce paiement."}
                )

        if module_supplied:
            category = "module" if module is not None else "autres"
        elif category_supplied:
            if category == "autres":
                attrs["module"] = None
                module = None
            elif category == "module" and module is None:
                raise serializers.ValidationError(
                    {"module": "Sélectionnez un module pour ce paiement."}
                )
        elif self.instance is None:
            category = "module" if module is not None else "autres"

        # On ne bloque pas la modification d'un ancien paiement « module »
        # dont le module aurait été supprimé entre-temps.
        if (
            (module_supplied or category_supplied)
            and category == "module"
            and module is None
        ):
            raise serializers.ValidationError(
                {"module": "Sélectionnez un module pour ce paiement."}
            )

        attrs["category"] = category or "autres"
        return attrs


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
