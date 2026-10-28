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
