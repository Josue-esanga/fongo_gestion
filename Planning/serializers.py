"""Serializers de l'application planning."""

from rest_framework import serializers

from fongo_user.serializers import UserCompactSerializer

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    dirigent = UserCompactSerializer(read_only=True)
    dirigent_id = serializers.IntegerField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "description",
            "date",
            "dirigent",
            "dirigent_id",
            "created_at",
        )
        read_only_fields = ("id", "created_at", "dirigent")

    def create(self, validated_data):
        request = self.context["request"]
        dirigent_id = validated_data.pop("dirigent_id", None)
        if dirigent_id and (
            request.user.is_superuser or request.user.role in ("admin", "super_admin")
        ):
            validated_data["dirigent_id"] = dirigent_id
        else:
            validated_data["dirigent"] = request.user
        return super().create(validated_data)
