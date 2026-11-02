"""Permissions transverses de l'API FongoGestion."""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrSuperAdmin(BasePermission):
    """Autorise uniquement les administrateurs et super administrateurs."""

    message = "Action réservée aux administrateurs."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role in ("admin", "super_admin"))
        )


class IsCaissierOrSuperAdmin(BasePermission):
    """Autorise le super administrateur et les admins ayant le rôle caissier."""

    message = "Action réservée aux caissiers et au super administrateur."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role == "super_admin":
            return True
        return bool(
            user.role == "admin"
            and "caissier" in (user.roles_supplementaires or [])
        )


def _is_super_admin(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.role == "super_admin")
    )


def _has_extra_role(user, role: str) -> bool:
    return bool(
        user
        and user.is_authenticated
        and user.role == "admin"
        and role in (user.roles_supplementaires or [])
    )


class IsAdminOrReadOnly(BasePermission):
    """Lecture ouverte à tout utilisateur connecté, écriture réservée aux admins."""

    message = "Seuls les administrateurs peuvent modifier ces données."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.is_superuser or user.role in ("admin", "super_admin")


class IsSuperAdminOrReadOnly(BasePermission):
    """Lecture ouverte à tout utilisateur connecté, écriture réservée au super admin."""

    message = "Seul le super administrateur peut modifier ces données."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return _is_super_admin(user)


class IsSuperAdminOrCommunicationOrReadOnly(BasePermission):
    """Écriture réservée au super admin et aux admins « communication »."""

    message = (
        "Seuls le super administrateur et les admins chargés de la "
        "communication peuvent modifier les annonces."
    )

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return _is_super_admin(user) or _has_extra_role(user, "communication")


class IsSuperAdminOrFormateurOrReadOnly(BasePermission):
    """Écriture réservée au super admin et aux admins « formateur »."""

    message = (
        "Seuls le super administrateur et les admins formateurs peuvent "
        "modifier les devoirs."
    )

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return _is_super_admin(user) or _has_extra_role(user, "formateur")


class IsOwnerOrSuperAdmin(BasePermission):
    """Un utilisateur accède à ses propres données, un super admin à toutes."""

    message = "Vous n'avez pas accès à cette ressource."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if _is_super_admin(user):
            return True
        owner = getattr(obj, "id_stagiaire", None) or getattr(obj, "user", None) or obj
        return owner == user


class IsNonStagiaire(BasePermission):
    """Réservé aux comptes qui ne sont pas des stagiaires (admins, formateurs)."""

    message = "Cette action est réservée aux administrateurs."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role != 'stagiaire')
        )


class IsStagiaire(BasePermission):
    """Réservé aux stagiaires (pointage par QR code)."""

    message = "Cette action est réservée aux stagiaires."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and not user.is_superuser
            and user.role == 'stagiaire'
        )


class IsSuperAdmin(BasePermission):
    """Réservé au super administrateur."""

    message = "Cette action est réservée au super administrateur."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role == 'super_admin')
        )


class IsOwnerOrAdmin(BasePermission):
    """Un utilisateur accède à ses propres données, un admin à toutes."""

    message = "Vous n'avez pas accès à cette ressource."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role in ("admin", "super_admin"):
            return True
        owner = getattr(obj, "id_stagiaire", None) or getattr(obj, "user", None) or obj
        return owner == user
