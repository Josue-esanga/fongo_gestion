"""Serializers de l'application paramètres."""

from rest_framework import serializers

from .models import Configuration


class ConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuration
        fields = ("id", "nom_club", "logo", "frais_formation")
