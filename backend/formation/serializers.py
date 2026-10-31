"""Serializers de l'application formation."""

from rest_framework import serializers

from fongo_user.models import User
from fongo_user.serializers import UserCompactSerializer

from .models import Formateur, Module


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
