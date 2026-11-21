"""Serializers de l'application devoirs."""

import os

from rest_framework import serializers

from .models import Devoir


class DevoirSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()
    cible_display = serializers.CharField(source="get_cible_display", read_only=True)
    # Nom d'origine + poids calculés à l'enregistrement (lecture seule).
    file_name = serializers.CharField(read_only=True)
    file_size = serializers.IntegerField(read_only=True)
    # Champ d'écriture uniquement : retirer le fichier joint en édition.
    file_clear = serializers.BooleanField(write_only=True, required=False)

    # Formats acceptés pour un devoir joint : documents et images.
    ALLOWED_EXTENSIONS = (
        ".pdf",
        ".doc",
        ".docx",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
    )
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 Mo

    class Meta:
        model = Devoir
        fields = (
            "id",
            "title",
            "description",
            "file",
            "file_name",
            "file_size",
            "file_clear",
            "limit_date",
            "cible",
            "cible_display",
            "created_at",
            "is_expired",
        )
        read_only_fields = (
            "id",
            "created_at",
            "is_expired",
            "cible_display",
            "file_name",
            "file_size",
        )

    def get_is_expired(self, obj) -> bool:
        from django.utils import timezone

        return obj.limit_date < timezone.now()

    def validate_file(self, fichier):
        """Contrôle le fichier joint : format, poids, contenu non vide."""
        if not fichier:
            return fichier

        extension = os.path.splitext(fichier.name)[1].lower()
        if extension not in self.ALLOWED_EXTENSIONS:
            formats = ", ".join(self.ALLOWED_EXTENSIONS)
            raise serializers.ValidationError(
                f"Format non accepté ({extension or 'inconnu'}). "
                f"Formats autorisés : {formats}."
            )

        taille = getattr(fichier, "size", 0) or 0
        if taille == 0:
            raise serializers.ValidationError("Le fichier est vide.")
        if taille > self.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                "Le fichier dépasse la limite de 10 Mo."
            )
        return fichier

    def _apply_file_clear(self, validated_data):
        """Supprime le fichier marqué « à retirer » par le frontend."""
        if not validated_data.pop("file_clear", False):
            return
        if self.instance and self.instance.file:
            self.instance.file.delete(save=False)
        validated_data["file"] = None
        validated_data["file_name"] = ""
        validated_data["file_size"] = 0

    @staticmethod
    def _remember_file(validated_data):
        """Mémorise le nom d'origine et le poids du fichier reçu."""
        fichier = validated_data.get("file")
        if fichier is not None and hasattr(fichier, "name"):
            validated_data["file_name"] = os.path.basename(fichier.name)
            validated_data["file_size"] = getattr(fichier, "size", 0) or 0

    @staticmethod
    def _forget_replaced_file(instance, ancien_nom):
        """Purge l'ancien fichier remplacé (pas d'orphelin dans le stockage)."""
        nouveau_nom = instance.file.name if instance.file else None
        if ancien_nom and nouveau_nom != ancien_nom:
            from django.core.files.storage import default_storage

            if default_storage.exists(ancien_nom):
                default_storage.delete(ancien_nom)

    def create(self, validated_data):
        self._apply_file_clear(validated_data)
        self._remember_file(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        ancien_nom = instance.file.name if instance.file else None
        self._apply_file_clear(validated_data)
        self._remember_file(validated_data)
        devoir = super().update(instance, validated_data)
        self._forget_replaced_file(devoir, ancien_nom)
        return devoir
