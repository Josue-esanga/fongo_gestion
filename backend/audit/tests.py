"""Tests du journal d'audit (signaux + API réservée au super admin)."""

from contextlib import contextmanager
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory, TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from annonce.models import Annonce

from .middleware import reset_current_request, set_current_request
from .models import AuditLog

User = get_user_model()


@contextmanager
def auditing(user=None):
    """Simule une requête HTTP pendant laquelle l'audit est actif."""
    request = RequestFactory().get("/")
    request.user = user if user is not None else AnonymousUser()
    token = set_current_request(request)
    try:
        yield request
    finally:
        reset_current_request(token)


class AuditSignalTests(TestCase):
    """Les écritures du projet sont tracées automatiquement."""

    def setUp(self):
        self.author = User.objects.create_user(
            username="boss", password="motdepasse123", role="super_admin"
        )

    def _make_annonce(self, title="FongoExpo"):
        return Annonce.objects.create(
            object=title,
            contenu="Bienvenue",
            auteur=self.author,
        )

    def test_create_is_logged(self):
        with auditing(self.author):
            annonce = self._make_annonce()

        entry = AuditLog.objects.get(action=AuditLog.ACTION_CREATE)
        self.assertEqual(entry.username, "boss")
        self.assertEqual(entry.user, self.author)
        self.assertEqual(entry.model_label, "annonce.annonce")
        self.assertEqual(entry.object_id, str(annonce.pk))
        self.assertEqual(entry.object_repr, "FongoExpo")

    def test_update_logs_only_changed_fields(self):
        with auditing(self.author):
            annonce = self._make_annonce()

        with auditing(self.author):
            annonce.object = "FongoExpo 2"
            annonce.save()

        entry = AuditLog.objects.get(action=AuditLog.ACTION_UPDATE)
        self.assertEqual(set(entry.changes), {"object"})
        self.assertEqual(entry.changes["object"]["old"], "FongoExpo")
        self.assertEqual(entry.changes["object"]["new"], "FongoExpo 2")

    def test_save_without_change_is_not_logged(self):
        with auditing(self.author):
            annonce = self._make_annonce()

        with auditing(self.author):
            annonce.save()

        self.assertEqual(
            AuditLog.objects.filter(action=AuditLog.ACTION_UPDATE).count(), 0
        )

    def test_delete_is_logged(self):
        with auditing(self.author):
            annonce = self._make_annonce()
        with auditing(self.author):
            annonce.delete()

        entry = AuditLog.objects.get(action=AuditLog.ACTION_DELETE)
        self.assertEqual(entry.model_label, "annonce.annonce")
        self.assertEqual(entry.username, "boss")

    def test_no_log_outside_a_request(self):
        # Commandes de gestion / migrations : pas de requête, pas d'entrée.
        self._make_annonce()
        self.assertEqual(AuditLog.objects.count(), 0)

    def test_password_change_is_masked(self):
        # L'objet est rechargé pendant la requête : c'est ainsi que DRF obtient
        # l'instance (snapshot des champs disponible pour le diff).
        with auditing(self.author):
            author = User.objects.get(pk=self.author.pk)
            author.set_password("nouveaumotdepasse")
            author.save()

        entry = AuditLog.objects.get(action=AuditLog.ACTION_UPDATE)
        self.assertEqual(entry.changes["password"], {"old": "••••••", "new": "••••••"})

    def test_activity_noise_is_ignored(self):
        # `last_seen` / `last_login` ne déclenchent aucune entrée.
        with auditing(self.author):
            author = User.objects.get(pk=self.author.pk)
            author.last_seen = timezone.now()
            author.save(update_fields=["last_seen"])

        self.assertEqual(AuditLog.objects.filter(action=AuditLog.ACTION_UPDATE).count(), 0)

    def test_ip_and_user_agent_are_recorded(self):
        with auditing(self.author) as request:
            request.META["REMOTE_ADDR"] = "127.0.0.1"
            request.META["HTTP_USER_AGENT"] = "pytest/1.0"
            self._make_annonce()

        entry = AuditLog.objects.get(action=AuditLog.ACTION_CREATE)
        self.assertEqual(entry.ip_address, "127.0.0.1")
        self.assertEqual(entry.user_agent, "pytest/1.0")


class AuditApiTests(TestCase):
    """L'API d'audit est réservée au super administrateur."""

    def setUp(self):
        self.superadmin = User.objects.create_user(
            username="root", password="motdepasse123", role="super_admin"
        )
        self.admin = User.objects.create_user(
            username="admin1", password="motdepasse123", role="admin"
        )
        self.client = APIClient()

    def test_logs_forbidden_for_admin(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get("/api/audit/logs/").status_code, 403)
        self.assertEqual(self.client.get("/api/audit/summary/").status_code, 403)

    def test_logs_allowed_for_super_admin(self):
        with auditing(self.superadmin):
            Annonce.objects.create(
                object="Annonce", contenu="…", auteur=self.superadmin
            )

        self.client.force_authenticate(self.superadmin)
        response = self.client.get("/api/audit/logs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["action"], "create")

    def test_logs_forbidden_for_anonymous(self):
        self.assertEqual(self.client.get("/api/audit/logs/").status_code, 401)

    def test_summary_shape(self):
        self.client.force_authenticate(self.superadmin)
        response = self.client.get("/api/audit/summary/")
        self.assertEqual(response.status_code, 200)

        payload = response.data
        for key in ("totals", "by_action", "by_model", "top_users", "daily", "tracked_models"):
            self.assertIn(key, payload)
        self.assertEqual(len(payload["daily"]), 14)
        self.assertIn("annonce.annonce", [m["label"] for m in payload["tracked_models"]])

    def test_login_is_logged(self):
        User.objects.create_user(
            username="mari", password="motdepasse123", role="stagiaire"
        )

        response = self.client.post(
            "/api/auth/token/",
            {"username": "mari", "password": "motdepasse123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        entry = AuditLog.objects.get(action=AuditLog.ACTION_LOGIN)
        self.assertEqual(entry.username, "mari")
        self.assertIsNotNone(entry.user)

    def test_search_and_filters(self):
        with auditing(self.superadmin):
            Annonce.objects.create(object="Alpha", contenu="…", auteur=self.superadmin)
        with auditing(self.superadmin):
            Annonce.objects.create(object="Beta", contenu="…", auteur=self.superadmin)
        AuditLog.objects.filter(object_repr="Beta").update(
            created_at=timezone.now() - timedelta(days=40)
        )

        self.client.force_authenticate(self.superadmin)

        response = self.client.get("/api/audit/logs/", {"search": "Alpha"})
        self.assertEqual(response.data["count"], 1)

        response = self.client.get("/api/audit/logs/", {"action": "create"})
        self.assertEqual(response.data["count"], 2)

        response = self.client.get("/api/audit/logs/", {"model_label": "annonce.annonce"})
        self.assertEqual(response.data["count"], 2)
