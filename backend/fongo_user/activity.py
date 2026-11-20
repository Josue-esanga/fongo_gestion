"""Suivi de l'activité de session des utilisateurs.

Le statut affiché dans la liste des membres (« Actif » / « Inactif ») reflète
la session réelle : un utilisateur est actif s'il a émis une requête
authentifiée récemment **et** si son compte est actif.

Les jetons JWT étant sans état (aucune table de sessions), on ne peut pas
savoir si un utilisateur s'est déconnecté : on observe donc la dernière
activité observée côté serveur.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication

User = get_user_model()

# Une session est considérée comme active si l'utilisateur a fait vivre son
# jeton dans ce délai (30 min : largement au-delà d'une simple navigation,
# suffisamment court pour que la colonne Statut reste honnête).
SESSION_ACTIVE_WINDOW = timedelta(minutes=30)

# `last_seen` n'est écrit qu'au plus toutes les 60 s et par utilisateur :
# pas d'écriture en base à chaque requête.
ACTIVITY_WRITE_INTERVAL = timedelta(minutes=1)


def session_is_active(user) -> bool:
    """Vrai si la session de `user` est encore active (compte + activité récente)."""
    if not getattr(user, "is_active", False):
        return False
    # Repli sur `last_login` : un utilisateur connecté depuis la mise en place
    # de ce champ n'a pas encore de `last_seen` mais a déjà une session.
    last = getattr(user, "last_seen", None) or getattr(user, "last_login", None)
    if last is None:
        return False
    return timezone.now() - last <= SESSION_ACTIVE_WINDOW


class ActivityJWTAuthentication(JWTAuthentication):
    """Authentification JWT qui trace la dernière activité de l'utilisateur."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        self.touch(result[0])
        return result

    @staticmethod
    def touch(user) -> None:
        now = timezone.now()
        last_seen = getattr(user, "last_seen", None)
        if last_seen is None or now - last_seen >= ACTIVITY_WRITE_INTERVAL:
            User.objects.filter(pk=user.pk).update(last_seen=now)
            # Conserve la valeur en mémoire pour la durée de la requête.
            user.last_seen = now
