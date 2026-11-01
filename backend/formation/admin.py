from django.contrib import admin

from .models import Formateur, Module


@admin.register(Formateur)
class FormateurAdmin(admin.ModelAdmin):
    list_display = ("user", "matiere")
    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "matiere",
    )


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("ordre", "titre", "duree", "image")
    search_fields = ("titre", "description")
    filter_horizontal = ("formateurs",)
    fields = (
        "ordre",
        "titre",
        "image",
        "duree",
        "sujets",
        "description",
        "formateurs",
    )
