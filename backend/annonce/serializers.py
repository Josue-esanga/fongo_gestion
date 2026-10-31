"""Serializers de l'application annonces."""

from rest_framework import serializers

from fongo_user.serializers import UserCompactSerializer

from .models import Annonce


class AnnonceSerializer(serializers.ModelSerializer):
    auteur = UserCompactSerializer(read_only=True)
    auteur_id = serializers.IntegerField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Annonce
        fields = ("id", "object", "contenu", "poster_a", "auteur", "auteur_id")
        read_only_fields = ("id", "poster_a", "auteur")

    def create(self, validated_data):
        request = self.context["request"]
        auteur_id = validated_data.pop("auteur_id", None)
        if auteur_id and (
            request.user.is_superuser or request.user.role in ("admin", "super_admin")
        ):
            validated_data["auteur_id"] = auteur_id
        else:
            validated_data["auteur"] = request.user
        return super().create(validated_data)
