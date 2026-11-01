"""Règles temporelles des présences.

La formation FongoLab se déroule **du lundi au vendredi** : le QR code d'appel
n'est fonctionnel que sur ces jours-là (impossible de démarrer un appel ou de
scanner le week-end) et les séances sont classées par jour dans l'interface.

``date_du_jour`` constitue l'unique point d'entrée pour connaître « aujourd'hui »
(vues, sérialiseur et modèle passent par ce seam), ce qui rend la règle
testable : les tests figent la date à la volée quel que soit le jour réel.
"""

from django.utils import timezone


JOURS_FR = (
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
    'dimanche',
)


def date_du_jour():
    """Date locale du jour (source unique de vérité pour les présences)."""
    return timezone.localdate()


def est_jour_formation(date=None) -> bool:
    """Vrai du lundi au vendredi (la formation n'a pas lieu le week-end)."""
    if date is None:
        date = date_du_jour()
    return date.weekday() < 5


def message_hors_formation() -> str:
    """Message explicite renvoyé quand le week-end bloque un pointage."""
    jour = JOURS_FR[date_du_jour().weekday()]
    return (
        "La formation a lieu du lundi au vendredi : aucune présence "
        f"n'est relevée ce {jour}."
    )
