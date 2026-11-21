from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit'
    verbose_name = "Journal d'audit"

    def ready(self):
        # Branchement automatique des signaux sur tous les modèles des
        # applications du projet : chaque écriture devient une entrée de
        # journal (« qui a fait quoi ») sans code supplémentaire dans les vues.
        from . import signals

        signals.connect_tracked_models()
