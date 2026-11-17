"""Serializers de l'application devoirs."""

from rest_framework import serializers

from .models import Devoir


class DevoirSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()
    cible_display = serializers.CharField(source="get_cible_display", read_only=True)

    class Meta:
        model = Devoir
        fields = (
            "id",
            "title",
            "description",
            "limit_date",
            "cible",
            "cible_display",
            "created_at",
            "is_expired",
        )
        read_only_fields = ("id", "created_at", "is_expired", "cible_display")

    def get_is_expired(self, obj) -> bool:
        from django.utils import timezone

        return obj.limit_date < timezone.now()
