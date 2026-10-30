"""Permissions transverses de l'API FongoGestion.

Règles métier :
- le super administrateur est le seul à pouvoir modifier les membres, le
  planning, les annonces, la formation, les modules et les paramètres du
  projet ;
- l'annuaire des membres et les modules sont en lecture pour tous les
  utilisateurs sauf les stagiaires ;
- un administrateur doté du rôle supplémentaire « formateur » ne gère que les
  devoirs ;
- un administrateur doté du rôle supplémentaire « caissier » ne gère que la
  finance ;
- un simple administrateur reste en lecture seule ;
- un stagiaire ne peut modifier que sa propre photo de profil ;
- la gestion des présences (séance d'appel + QR code) est ouverte à tous les
  utilisateurs sauf aux stagiaires, qui ne peuvent que scanner le QR code et
  consulter leur propre statut.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission

# Rôles supplémentaires attribuables à un administrateur.
ROLES_SUPPLEMENTAIRES = ("formateur", "caissier")


def is_super_admin(user) -> bool:
    """Vrai pour le super administrateur (flag Django ou rôle ``super_admin``)."""
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.role == "super_admin")
    )


def has_extra_role(user, code: str) -> bool:
    """Vrai si l'utilisateur possède le rôle supplémentaire ``code``.

    Le super administrateur est autorisé à tous les rôles.
    """
    if is_super_admin(user):
        return True
    if not (user and user.is_authenticated and user.role == "admin"):
        return False
    roles = getattr(user, "roles_supplementaires", None) or []
    if not isinstance(roles, (list, tuple)):
        return False
    return code in roles


class IsSuperAdmin(BasePermission):
    """Autorise uniquement le super administrateur."""

    message = "Action réservée au super administrateur."

    def has_permission(self, request, view):
        return is_super_admin(request.user)


class IsSuperAdminOrReadOnly(BasePermission):
    """Lecture pour les utilisateurs authentifiés, écriture super administrateur."""

    message = "Seul le super administrateur peut modifier ces données."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return is_super_admin(user)


class IsDevoirEditor(BasePermission):
    """Écriture réservée au super administrateur et aux admins formateurs."""

    message = "Action réservée aux super administrateurs et aux formateurs."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return has_extra_role(user, "formateur")


class IsFinanceEditor(BasePermission):
    """Écriture réservée au super administrateur et aux admins caissiers."""

    message = "Action réservée aux super administrateurs et aux caissiers."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return has_extra_role(user, "caissier")


class IsNonStagiaire(BasePermission):
    """Réservé aux utilisateurs hors rôle ``stagiaire``."""

    message = "Cette option est masquée aux stagiaires."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role != "stagiaire")


class IsStagiaire(BasePermission):
    """Réservé aux stagiaires (scan du QR code, statut de présence personnel)."""

    message = "Action réservée aux stagiaires."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "stagiaire")


class IsMemberViewer(IsNonStagiaire):
    """Annuaire des membres : accessible à tous sauf aux stagiaires."""

    message = "L'annuaire des membres est réservé aux administrateurs."


class IsProgrammeAccess(BasePermission):
    """Modules pédagogiques : lecture hors stagiaires, écriture super admin."""

    message = "Action réservée au super administrateur."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return user.role != "stagiaire"
        return is_super_admin(user)
