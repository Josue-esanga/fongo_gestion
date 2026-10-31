"""Serializers de l'application utilisateurs (authentification incluse)."""

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
            "role_display",
            "pictures",
            "is_active",
            "date_joined",
            "password",
        )
        read_only_fields = ("id", "date_joined", "role_display", "full_name")
        extra_kwargs = {
            "email": {"required": False, "allow_blank": True},
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username

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
            "pictures",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "username", "role", "is_active", "date_joined")

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
