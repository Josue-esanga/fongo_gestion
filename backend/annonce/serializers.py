"""Serializers de l'application annonces."""

from rest_framework import serializers

from fongo_user.serializers import UserCompactSerializer

from .models import Annonce


class AnnonceSerializer(serializers.ModelSerializer):
    auteur = UserCompactSerializer(read_only=True)
    auteur_id = serializers.IntegerField(
        write_only=True, required=False, allow_null=True
    )
    cible_display = serializers.CharField(
        source="get_cible_display", read_only=True
    )
    template_display = serializers.CharField(
        source="get_template_display", read_only=True
    )
    # Champs d'écriture uniquement : retirer une image existante en édition.
    image1_clear = serializers.BooleanField(write_only=True, required=False)
    image2_clear = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Annonce
        fields = (
            "id",
            "object",
            "contenu",
            "cible",
            "cible_display",
            "template",
            "template_display",
            "date_prevue",
            "image1",
            "image2",
            "image1_clear",
            "image2_clear",
            "poster_a",
            "auteur",
            "auteur_id",
        )
        read_only_fields = ("id", "poster_a", "auteur")
        extra_kwargs = {
            # Le frontend impose déjà une date ; on garde une valeur par
            # défaut côté API pour rester tolérant.
            "date_prevue": {"required": False},
        }

    def _apply_image_clear(self, validated_data):
        """Supprime les images marquées comme retirées par le frontend."""
        for field in ("image1", "image2"):
            if validated_data.pop(f"{field}_clear", False):
                image = getattr(self.instance, field, None) if self.instance else None
                if image:
                    image.delete(save=False)
                validated_data[field] = None

    def _set_auteur(self, validated_data):
        request = self.context["request"]
        auteur_id = validated_data.pop("auteur_id", None)
        if auteur_id and (
            request.user.is_superuser
            or request.user.role in ("admin", "super_admin")
        ):
            validated_data["auteur_id"] = auteur_id
        else:
            validated_data["auteur"] = request.user

    def create(self, validated_data):
        self._apply_image_clear(validated_data)
        self._set_auteur(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._apply_image_clear(validated_data)
        validated_data.pop("auteur_id", None)
        return super().update(instance, validated_data)
