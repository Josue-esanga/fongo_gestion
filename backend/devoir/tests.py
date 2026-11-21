"""Tests des devoirs : pièce jointe (PDF / Word / image) et permissions.

Le formateur (ou le super admin) peut joindre un fichier à un devoir ; les
stagiaires ne reçoivent que l'URL du document, jamais le droit d'en créer.
"""

import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Devoir

User = get_user_model()

# Stockage forcé sur disque local : un test ne doit jamais déposer de
# fichiers dans le bucket Supabase Storage configuré via `.env`.
LOCAL_STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

PDF = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF"


def un_fichier(nom="enonce.pdf", contenu=PDF, content_type="application/pdf"):
    return SimpleUploadedFile(nom, contenu, content_type=content_type)


@override_settings(STORAGES=LOCAL_STORAGES)
class DevoirFileTests(TestCase):
    """CRUD du fichier joint au devoir."""

    def setUp(self):
        self.media_root = tempfile.mkdtemp(prefix="devoir_test_")
        self.addCleanup(shutil.rmtree, self.media_root, True)
        self.override = override_settings(MEDIA_ROOT=self.media_root)
        self.override.enable()
        self.addCleanup(self.override.disable)

        self.client = APIClient()
        self.formateur = User.objects.create_user(
            username="prof", password="motdepasse123", role="admin",
            roles_supplementaires=["formateur"],
        )
        self.admin_sans_role = User.objects.create_user(
            username="admin1", password="motdepasse123", role="admin"
        )
        self.superadmin = User.objects.create_user(
            username="root", password="motdepasse123", role="super_admin"
        )
        self.stagiaire = User.objects.create_user(
            username="alice", password="motdepasse123", role="stagiaire"
        )

    def _payload(self, **kwargs):
        payload = {
            "title": "Exercice React",
            "description": "Réaliser les exercices 1 à 5 du chapitre hooks.",
            "limit_date": "2030-01-01T12:00:00Z",
            "cible": "tous",
        }
        payload.update(kwargs)
        return payload

    def _create(self, user, fichier=None, **kwargs):
        self.client.force_authenticate(user)
        data = self._payload(**kwargs)
        if fichier is not None:
            data["file"] = fichier
        return self.client.post("/api/devoirs/", data, format="multipart")

    # --- Formats acceptés -------------------------------------------------

    def test_formateur_can_attach_a_pdf(self):
        response = self._create(self.formateur, un_fichier())
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["file_name"], "enonce.pdf")
        self.assertTrue(response.data["file"].endswith(".pdf"))
        self.assertGreater(response.data["file_size"], 0)

        devoir = Devoir.objects.get(pk=response.data["id"])
        self.assertTrue(devoir.file)
        self.assertEqual(devoir.file_name, "enonce.pdf")
        self.assertTrue(default_storage.exists(devoir.file.name))

    def test_word_document_is_accepted(self):
        fichier = SimpleUploadedFile(
            "cours.docx", b"PK\x03\x04fake", content_type="application/zip"
        )
        response = self._create(self.formateur, fichier)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["file_name"], "cours.docx")

    def test_legacy_word_document_is_accepted(self):
        fichier = SimpleUploadedFile(
            "annexe.doc", b"\xd0\xcf\x11\xe0fake", content_type="application/msword"
        )
        response = self._create(self.formateur, fichier)
        self.assertEqual(response.status_code, 201, response.data)

    def test_image_is_accepted(self):
        png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        )
        fichier = SimpleUploadedFile("schema.png", png, content_type="image/png")
        response = self._create(self.formateur, fichier)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["file_name"], "schema.png")

    def test_devoir_without_file_is_allowed(self):
        response = self._create(self.formateur)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data["file"])
        self.assertEqual(response.data["file_name"], "")

    # --- Fichiers refusés -------------------------------------------------

    def test_rejected_extension(self):
        fichier = SimpleUploadedFile(
            "virus.exe", b"MZ\x90\x00", content_type="application/octet-stream"
        )
        response = self._create(self.formateur, fichier)
        self.assertEqual(response.status_code, 400)
        self.assertIn("file", response.data)

    def test_rejected_image_extension(self):
        # Un SVG peut embarquer du script : refusé au profit des images pixel.
        fichier = SimpleUploadedFile(
            "image.svg", b"<svg onload='alert(1)'/>", content_type="image/svg+xml"
        )
        response = self._create(self.formateur, fichier)
        self.assertEqual(response.status_code, 400)

    def test_oversized_file_is_rejected(self):
        gros = SimpleUploadedFile("gros.pdf", PDF + b"0" * (10 * 1024 * 1024 + 1))
        response = self._create(self.formateur, gros)
        self.assertEqual(response.status_code, 400)

    def test_empty_file_is_rejected(self):
        vide = SimpleUploadedFile("vide.pdf", b"")
        response = self._create(self.formateur, vide)
        self.assertEqual(response.status_code, 400)

    # --- Permissions ------------------------------------------------------

    def test_stagiaire_cannot_create_a_devoir(self):
        response = self._create(self.stagiaire, un_fichier())
        self.assertEqual(response.status_code, 403)

    def test_admin_without_formateur_role_cannot_create(self):
        response = self._create(self.admin_sans_role, un_fichier())
        self.assertEqual(response.status_code, 403)

    def test_super_admin_can_create(self):
        response = self._create(self.superadmin, un_fichier())
        self.assertEqual(response.status_code, 201, response.data)

    def test_stagiaire_can_read_the_file(self):
        created = self._create(self.formateur, un_fichier()).data

        self.client.force_authenticate(self.stagiaire)
        liste = self.client.get("/api/devoirs/")
        self.assertEqual(liste.status_code, 200)
        devoir = next(d for d in liste.data["results"] if d["id"] == created["id"])
        self.assertEqual(devoir["file_name"], "enonce.pdf")
        self.assertTrue(devoir["file"])
        self.assertGreater(devoir["file_size"], 0)

    # --- Modification / retrait -------------------------------------------

    def test_file_can_be_replaced(self):
        created = self._create(self.formateur, un_fichier("ancien.pdf")).data
        ancien = Devoir.objects.get(pk=created["id"]).file.name

        self.client.force_authenticate(self.formateur)
        response = self.client.patch(
            f"/api/devoirs/{created['id']}/",
            {"file": un_fichier("nouveau.pdf")},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["file_name"], "nouveau.pdf")

        devoir = Devoir.objects.get(pk=created["id"])
        self.assertNotEqual(devoir.file.name, ancien)
        self.assertFalse(default_storage.exists(ancien))
        self.assertTrue(default_storage.exists(devoir.file.name))

    def test_file_can_be_cleared(self):
        created = self._create(self.formateur, un_fichier()).data
        nom = Devoir.objects.get(pk=created["id"]).file.name

        self.client.force_authenticate(self.formateur)
        response = self.client.patch(
            f"/api/devoirs/{created['id']}/", {"file_clear": True}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertIsNone(response.data["file"])
        self.assertEqual(response.data["file_name"], "")
        self.assertEqual(response.data["file_size"], 0)

        devoir = Devoir.objects.get(pk=created["id"])
        self.assertFalse(devoir.file)
        self.assertFalse(default_storage.exists(nom))

    def test_updating_text_keeps_the_file(self):
        created = self._create(self.formateur, un_fichier()).data

        self.client.force_authenticate(self.formateur)
        response = self.client.patch(
            f"/api/devoirs/{created['id']}/",
            {"description": "Consignes mises à jour."},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["file_name"], "enonce.pdf")
        self.assertTrue(response.data["file"])

    def test_stagiaire_cannot_modify_a_file(self):
        created = self._create(self.formateur, un_fichier()).data

        self.client.force_authenticate(self.stagiaire)
        response = self.client.patch(
            f"/api/devoirs/{created['id']}/",
            {"file": un_fichier("pirate.pdf")},
            format="multipart",
        )
        self.assertEqual(response.status_code, 403)
