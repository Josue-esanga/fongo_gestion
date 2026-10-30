from django.contrib import admin

from .models import Presence, SeancePresence


@admin.register(SeancePresence)
class SeancePresenceAdmin(admin.ModelAdmin):
    list_display = ("libelle", "date", "ouverte", "created_at")
    list_filter = ("date", "ouverte")


@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ("stagiaire", "seance", "horodatage")
    list_filter = ("seance__date",)
