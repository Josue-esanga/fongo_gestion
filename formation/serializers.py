"""Serializers de l'application formation."""

import json

from rest_framework import serializers

from fongo_user.models import User
from fongo_user.serializers import UserCompactSerializer

from .models import Formateur, Module, ModulePedagogique


class ModulePedagogiqueSerializer(serializers.ModelSerializer):
    """Grille des modules (titre + liste des sujets abordés)."""

    class Meta:
        model = ModulePedagogique
        fields = ("id", "ordre", "titre", "sujets", "description")
        extra_kwargs = {
            "titre": {"required": True},
            "description": {"required": False, "allow_blank": True},
        }

    def validate_ordre(self, value):
        if value < 1:
            raise serializers.ValidationError("L'ordre doit être supérieur à zéro.")
        return value

    def validate_sujets(self, value):
        if value in (None, ""):
            return []
        if isinstance(value, str):
            text = value.strip()
            if not text:
                return []
            if text.startswith("["):
                # Chaîne JSON (multipart ou payload texte).
                try:
                    value = json.loads(text)
                except ValueError:
                    raise serializers.ValidationError(
                        "Format invalide : une liste JSON est attendue."
                    )
            else:
                # Texte brut : un sujet par ligne.
                value = [item.strip() for item in text.splitlines() if item.strip()]
        if not isinstance(value, list) or not all(
            isinstance(item, str) and item.strip() for item in value
        ):
            raise serializers.ValidationError(
                "Format invalide : une liste de sujets est attendue."
            )
        return [item.strip() for item in value]


class ModuleSerializer(serializers.ModelSerializer):
    formateur_nom = serializers.CharField(source="id_formateur.__str__", read_only=True)

    class Meta:
        model = Module
        fields = ("id", "cours", "duree", "id_formateur", "formateur_nom")
        extra_kwargs = {"id_formateur": {"write_only": True}}


class FormateurSerializer(serializers.ModelSerializer):
    user = UserCompactSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=("admin", "super_admin")),
        source="user",
        write_only=True,
    )
    modules = ModuleSerializer(source="module_set", many=True, read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    pictures = serializers.ImageField(source="user.pictures", read_only=True)

    class Meta:
        model = Formateur
        fields = (
            "id",
            "user",
            "user_id",
            "username",
            "email",
            "pictures",
            "matiere",
            "bio",
            "modules",
        )
