from django.contrib import admin

from .models import Ajout_Argent


@admin.register(Ajout_Argent)
class AjoutArgentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "id_stagiaire",
        "montant",
        "category",
        "module",
        "moyen",
        "statut",
        "created_at",
    )
    list_filter = ("category", "moyen", "statut", "created_at")
    search_fields = (
        "description",
        "id_stagiaire__username",
        "id_stagiaire__last_name",
        "module__titre",
    )
    list_select_related = ("id_stagiaire", "module")
    date_hierarchy = "created_at"
