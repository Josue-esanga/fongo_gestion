"""Administration Django du journal d'audit (lecture seule)."""

from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Consultation du journal : aucune écriture possible depuis l'admin."""

    list_display = (
        "created_at",
        "username",
        "action",
        "model_label",
        "object_repr",
        "ip_address",
    )
    list_filter = ("action", "model_label", "created_at")
    search_fields = ("username", "object_repr", "model_label")
    date_hierarchy = "created_at"
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
