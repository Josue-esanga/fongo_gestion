"""Serializers de l'application formation."""

from rest_framework import serializers

from fongo_user.models import User
from fongo_user.serializers import UserCompactSerializer

from .models import Formateur, Module


class FormateurResumeSerializer(serializers.ModelSerializer):
    """Formateur minimal joint au détail d'un module."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Formateur
        fields = ("id", "full_name", "matiere")

    def get_full_name(self, obj) -> str:
        return obj.user.get_full_name() or obj.user.username


class ModuleSerializer(serializers.ModelSerializer):
    # Champ d'écriture uniquement : permet de retirer l'image en édition.
    image_clear = serializers.BooleanField(write_only=True, required=False)
    formateurs = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Formateur.objects.all(),
        required=False,
    )
    formateurs_detail = FormateurResumeSerializer(
        source="formateurs",
        many=True,
        read_only=True,
    )
    sujets = serializers.ListField(
        child=serializers.CharField(allow_blank=False, trim_whitespace=True),
        required=False,
    )

    class Meta:
        model = Module
        fields = (
            "id",
            "ordre",
            "titre",
            "image",
            "image_clear",
            "duree",
            "sujets",
            "description",
            "formateurs",
            "formateurs_detail",
        )
        extra_kwargs = {
            "ordre": {"min_value": 1},
            "duree": {"min_value": 0},
            "description": {"required": False, "allow_blank": True},
            "image": {"required": False, "allow_null": True},
        }

    def _apply_image_clear(self, validated_data):
        """Marque l'image comme retirée quand le frontend le demande."""
        if validated_data.pop("image_clear", False):
            validated_data["image"] = None

    def create(self, validated_data):
        self._apply_image_clear(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        ancienne_image = instance.image if instance.image else None
        self._apply_image_clear(validated_data)
        module = super().update(instance, validated_data)
        # Remplace ou retire le fichier précédent sans laisser d'orphelin.
        if (
            ancienne_image
            and "image" in validated_data
            and (not module.image or ancienne_image.name != module.image.name)
        ):
            ancienne_image.delete(save=False)
        return module


class FormateurSerializer(serializers.ModelSerializer):
    user = UserCompactSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=("admin", "super_admin")),
        source="user",
        write_only=True,
    )
    modules = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Module.objects.all(),
        required=False,
    )
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
