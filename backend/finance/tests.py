"""Tests de la finance : vue restreinte (nom + pourcentage) et dashboard.

Un admin qui n'est pas caissier doit pouvoir consulter l'avancement des
versements des stagiaires sans jamais recevoir — ni afficher — un montant.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from parametre.models import Configuration

from .models import Ajout_Argent

User = get_user_model()


def payer(stagiaire, montant, statut="valide", **kwargs):
    kwargs.setdefault("category", "autres")
    kwargs.setdefault("description", "Frais de formation")
    return Ajout_Argent.objects.create(
        montant=montant, statut=statut, id_stagiaire=stagiaire, **kwargs
    )


class FinanceProgressTests:
    """Fonctions communes aux cas d'accès à /api/finance/progress/."""

    def _setup(self):
        self.client = APIClient()
        self.stagiaire = User.objects.create_user(
            username="alice", password="motdepasse123", role="stagiaire"
        )
        self.stagiaire2 = User.objects.create_user(
            username="bob", password="motdepasse123", role="stagiaire"
        )
        self.admin = User.objects.create_user(
            username="admin1", password="motdepasse123", role="admin"
        )
        self.superadmin = User.objects.create_user(
            username="root", password="motdepasse123", role="super_admin"
        )
        self.configuration, _ = Configuration.objects.get_or_create(pk=1)
        self.configuration.frais_formation = 150000
        self.configuration.save(update_fields=["frais_formation"])


class ProgressEndpointTests(FinanceProgressTests, TestCase):
    """GET /api/finance/progress/ — noms + pourcentages uniquement."""

    def setUp(self):
        self._setup()
        payer(self.stagiaire, 75000)          # 50 %
        payer(self.stagiaire, 30000, statut="refuse")  # non compté
        payer(self.stagiaire2, 150000)        # 100 %

    def _rows(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/finance/progress/")
        self.assertEqual(response.status_code, 200)
        return response.data

    def test_admin_can_read_progress(self):
        rows = self._rows()
        self.assertEqual(len(rows), 2)

    def test_no_amount_is_exposed(self):
        """Aucune clé monétaire ne doit figurer dans la réponse."""
        for row in self._rows():
            for forbidden in ("montant", "total_paye", "frais_formation", "cible"):
                self.assertNotIn(forbidden, row)
            self.assertNotIn("montant", str(row))

    def test_percentage_is_computed_on_validated_payments_only(self):
        rows = {row["username"]: row for row in self._rows()}
        self.assertEqual(rows["alice"]["pourcentage"], 50)
        self.assertEqual(rows["bob"]["pourcentage"], 100)

    def test_percentage_is_capped_at_100(self):
        payer(self.stagiaire, 400000)
        rows = {row["username"]: row for row in self._rows()}
        self.assertEqual(rows["alice"]["pourcentage"], 100)

    def test_identity_fields_are_present(self):
        rows = {row["username"]: row for row in self._rows()}
        alice = rows["alice"]
        for field in ("id", "username", "first_name", "last_name", "full_name"):
            self.assertIn(field, alice)

    def test_forbidden_for_stagiaire(self):
        self.client.force_authenticate(self.stagiaire)
        self.assertEqual(self.client.get("/api/finance/progress/").status_code, 403)

    def test_forbidden_for_anonymous(self):
        self.assertEqual(self.client.get("/api/finance/progress/").status_code, 401)

    def test_allowed_for_super_admin(self):
        self.client.force_authenticate(self.superadmin)
        self.assertEqual(self.client.get("/api/finance/progress/").status_code, 200)


class DashboardFinanceLeakTests(FinanceProgressTests, TestCase):
    """Le dashboard ne doit pas servir de montant aux admins non caissiers."""

    def setUp(self):
        self._setup()
        payer(self.stagiaire, 90000)

    def _finance_payload(self, user):
        self.client.force_authenticate(user)
        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.status_code, 200)
        return response.data["finance"]

    def test_plain_admin_sees_no_amount(self):
        finance = self._finance_payload(self.admin)
        self.assertEqual(finance["total_collecte"], 0)
        self.assertEqual(finance["nombre_paiements"], 0)

    def test_super_admin_sees_global_total(self):
        finance = self._finance_payload(self.superadmin)
        self.assertEqual(finance["total_collecte"], 90000)

    def test_stagiaire_sees_only_his_own_total(self):
        finance = self._finance_payload(self.stagiaire)
        self.assertEqual(finance["total_collecte"], 90000)
