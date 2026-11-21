"""Serializers de l'application audit."""

from rest_framework import serializers

from fongo_user.serializers import UserCompactSerializer

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Entrée de journal, avec l'auteur compact et le libellé de l'action."""

    user = UserCompactSerializer(read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "user",
            "username",
            "action",
            "action_display",
            "model_label",
            "object_id",
            "object_repr",
            "changes",
            "ip_address",
            "user_agent",
            "created_at",
        )
        read_only_fields = fields
