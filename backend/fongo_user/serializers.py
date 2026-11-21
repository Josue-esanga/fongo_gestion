"""Serializers de l'application utilisateurs (authentification incluse)."""

import json

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from botocore.exceptions import ClientError

from audit.models import AuditLog
from audit.services import log_event

from .activity import session_is_active

User = get_user_model()


class ExistingPictureMixin:
    """N'expose pas une photo dont le fichier a disparu du stockage.

    Cela évite que le frontend tente de charger une URL média inexistante
    (404) et retombe proprement sur les initiales de l'utilisateur.
    """

    def to_representation(self, instance):
        data = super().to_representation(instance)
        picture = getattr(instance, "pictures", None)
        if data.get("pictures") and picture:
            try:
                if not picture.storage.exists(picture.name):
                    data["pictures"] = None
            except (ClientError, OSError, ValueError):
                data["pictures"] = None
        return data


class UserCompactSerializer(ExistingPictureMixin, serializers.ModelSerializer):
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
            "role",
            "roles_supplementaires",
            "pictures",
        )
        read_only_fields = fields

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username


class UserSerializer(ExistingPictureMixin, serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={"input_type": "password"},
        validators=[validate_password],
    )
    # Sans ce défaut explicite, DRF enregistre `False` quand le formulaire
    # n'envoie pas is_active : le nouveau membre ne peut alors pas se connecter.
    is_active = serializers.BooleanField(required=False, default=True)
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    # Statut de session dynamique (voir `fongo_user.activity`) : la liste des
    # membres affiche « Actif » quand la session vit encore, « Inactif » sinon.
    last_seen = serializers.SerializerMethodField()
    session_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "role_display",
            "roles_supplementaires",
            "pictures",
            "is_active",
            "last_seen",
            "session_active",
            "date_joined",
            "password",
        )
        read_only_fields = (
            "id",
            "date_joined",
            "role_display",
            "full_name",
            "last_seen",
            "session_active",
        )
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username

    def get_last_seen(self, obj):
        """Dernière activité (ISO), repli sur la date de connexion."""
        value = obj.last_seen or obj.last_login
        return value.isoformat() if value else None

    def get_session_active(self, obj) -> bool:
        """Vrai si la session de l'utilisateur est encore active."""
        return session_is_active(obj)

    def validate_roles_supplementaires(self, value):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError(
                    "Les rôles supplémentaires doivent être une liste."
                ) from exc
        # Union des rôles attribuables : admin (formateur/caissier/
        # communication) et stagiaire (frontend/backend). Le filtrage selon le
        # rôle principal est fait dans validate().
        allowed = {
            "formateur",
            "caissier",
            "communication",
            "frontend",
            "backend",
        }
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "Les rôles supplémentaires doivent être une liste."
            )
        invalid = [item for item in value if item not in allowed]
        if invalid:
            raise serializers.ValidationError(
                "Rôles supplémentaires invalides : "
                + ", ".join(str(item) for item in invalid)
                + "."
            )
        # Évite les doublons tout en conservant l'ordre choisi.
        return list(dict.fromkeys(value))

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "Le mot de passe est obligatoire à la création."}
            )
        request = self.context.get("request")
        if request and not request.user.is_staff and request.user.role not in (
            "admin",
            "super_admin",
        ):
            for protected in ("role", "is_active"):
                if protected in attrs:
                    raise serializers.ValidationError(
                        {protected: "Vous ne pouvez pas modifier ce champ."}
                    )

        # Les rôles supplémentaires dépendent du rôle principal : un admin
        # reçoit formateur / caissier / communication, un stagiaire
        # frontend / backend ; les autres rôles n'en ont pas. Les valeurs
        # incompatibles avec le rôle sont retirées silencieusement.
        role = attrs.get("role", getattr(self.instance, "role", None))
        if "roles_supplementaires" in attrs:
            value = attrs["roles_supplementaires"] or []
            if role == "admin":
                allowed = {"formateur", "caissier", "communication"}
            elif role == "stagiaire":
                allowed = {"frontend", "backend"}
            else:
                allowed = set()
            attrs["roles_supplementaires"] = [
                item for item in value if item in allowed
            ]
        elif role not in ("admin", "stagiaire"):
            attrs["roles_supplementaires"] = []
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


class ProfileSerializer(ExistingPictureMixin, serializers.ModelSerializer):
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
            "role",
            "roles_supplementaires",
            "pictures",
            "is_active",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "username",
            "role",
            "roles_supplementaires",
            "is_active",
            "date_joined",
        )

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username


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
        # Traçabilité : changement de mot de passe inscrit au journal d'audit
        # (la valeur elle-même n'est jamais conservée).
        log_event(
            AuditLog.ACTION_PASSWORD,
            user=user,
            object_repr=f"Mot de passe de {user.username} modifié",
        )
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
        # Journal d'audit : la connexion est le premier « qui a fait quoi ».
        log_event(
            AuditLog.ACTION_LOGIN,
            user=self.user,
            object_repr=f"Connexion de {self.user.username}",
        )
        data["user"] = ProfileSerializer(self.user, context=self.context).data
        return data
