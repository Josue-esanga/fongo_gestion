"""Serializers de l'application utilisateurs (authentification incluse)."""

import json

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserCompactSerializer(serializers.ModelSerializer):
    """Représentation légère d'un utilisateur, réutilisée par les autres apps."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "role",
            "pictures",
        )
        read_only_fields = fields

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={"input_type": "password"},
        validators=[validate_password],
    )
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    # Reçu sous forme de chaîne JSON depuis un formulaire (multipart).
    roles_supplementaires = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "role",
            "roles_supplementaires",
            "role_display",
            "pictures",
            "is_active",
            "is_superuser",
            "date_joined",
            "password",
        )
        read_only_fields = (
            "id",
            "date_joined",
            "role_display",
            "full_name",
            "is_superuser",
        )
        extra_kwargs = {
            "email": {"required": False, "allow_blank": True},
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username

    @staticmethod
    def _is_super_admin(user) -> bool:
        return bool(user and (user.is_superuser or user.role == "super_admin"))

    def validate_roles_supplementaires(self, value):
        """Valide les rôles supplémentaires : ``["formateur", "caissier"]``."""
        if value in (None, ""):
            return []
        if isinstance(value, str):
            # Reçu sous forme de chaîne : soit du JSON (multipart), soit une
            # liste séparée par des virgules (texte brut).
            text = value.strip()
            if not text:
                return []
            if text.startswith("["):
                try:
                    value = json.loads(text)
                except ValueError:
                    raise serializers.ValidationError(
                        "Format invalide : une liste JSON est attendue."
                    )
            else:
                value = [item for item in text.split(",") if item]
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "Format invalide : une liste de rôles est attendue."
            )
        valid = [code for code, _label in User.Role_supplementaire_choice]
        unknown = [item for item in value if item not in valid]
        if unknown:
            raise serializers.ValidationError(
                f"Rôle(s) supplémentaire(s) inconnu(s) : {', '.join(map(str, unknown))}."
            )
        # Un rôle supplémentaire n'a de sens que pour un administrateur.
        role = (self.initial_data.get("role") if self.initial_data else None) or (
            getattr(self.instance, "role", None) if self.instance else None
        )
        if role != "admin":
            return []
        # Pas de doublon, ordre stable.
        return [item for item in valid if item in value]

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "Le mot de passe est obligatoire à la création."}
            )
        request = self.context.get("request")
        user = request.user if request else None
        # Rôle, statut et rôles supplémentaires : super administrateur uniquement.
        if user and not self._is_super_admin(user):
            for protected in ("role", "is_active", "roles_supplementaires"):
                if protected in attrs:
                    raise serializers.ValidationError(
                        {protected: "Vous ne pouvez pas modifier ce champ."}
                    )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class ProfileSerializer(serializers.ModelSerializer):
    """Mise à jour du profil de l'utilisateur connecté."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "role",
            "roles_supplementaires",
            "pictures",
            "is_active",
            "is_superuser",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "username",
            "role",
            "roles_supplementaires",
            "is_active",
            "is_superuser",
            "date_joined",
        )

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username

    def validate(self, attrs):
        # Un stagiaire ne peut modifier que sa photo de profil.
        request = self.context.get("request")
        user = request.user if request else None
        if user and user.role == "stagiaire":
            modifiables = [key for key in attrs if key != "pictures"]
            if modifiables:
                raise serializers.ValidationError(
                    "Un stagiaire ne peut modifier que sa photo de profil."
                )
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("L'ancien mot de passe est incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Les deux mots de passe ne correspondent pas."}
            )
        return attrs

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class FongoTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Ajoute les informations utiles de l'utilisateur dans la réponse JWT."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["role"] = user.role
        token["full_name"] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = ProfileSerializer(self.user, context=self.context).data
        return data
