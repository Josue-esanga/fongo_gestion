"""Tests des annonces : page publique, endpoint public, capture de partage."""

import io
import os
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient
from rest_framework.test import APITestCase

from .models import Annonce

User = get_user_model()

# Stockage forcé sur disque : un test ne doit jamais déposer de fichier
# dans le bucket Supabase Storage configuré via `.env`.
LOCAL_STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}


def un_png(nom="capture.png", couleur=(3, 4, 94)):
    """PNG valide minimal, servi comme fichier téléversé."""
    buffer = io.BytesIO()
    Image.new("RGB", (40, 30), couleur).save(buffer, format="PNG")
    return SimpleUploadedFile(nom, buffer.getvalue(), content_type="image/png")


class PublicAnnonceTests(APITestCase):
    """GET /api/annonces/public/ doit fonctionner sans connexion."""

    def setUp(self):
        self.client = APIClient()
        self.auteur = User.objects.create_user(
            username="commu", password="motdepasse123", role="admin",
            roles_supplementaires=["communication"],
        )

        def une_annonce(object, cible="tous", jours=0):
            return Annonce.objects.create(
                object=object,
                contenu="Contenu de l'annonce.",
                cible=cible,
                auteur=self.auteur,
                date_prevue=timezone.now() + timezone.timedelta(days=jours),
            )

        self.publique = une_annonce("FongoExpo 2026")
        self.stagiaires = une_annonce("Réunion stagiaires", cible="stagiaires")
        self.privee = une_annonce("Réunion interne", cible="admins")

    def test_accessible_sans_connexion(self):
        response = self.client.get("/api/annonces/public/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_contient_les_annonces_visibles(self):
        response = self.client.get("/api/annonces/public/")
        objets = [annonce["object"] for annonce in response.data]
        self.assertIn("FongoExpo 2026", objets)
        self.assertIn("Réunion stagiaires", objets)

    def test_masque_les_annonces_admins(self):
        response = self.client.get("/api/annonces/public/")
        objets = [annonce["object"] for annonce in response.data]
        self.assertNotIn("Réunion interne", objets)

    def test_retourne_les_champs_daffichage(self):
        response = self.client.get("/api/annonces/public/")
        annonce = next(
            a for a in response.data if a["object"] == "FongoExpo 2026"
        )
        for champ in (
            "id",
            "object",
            "contenu",
            "cible",
            "template",
            "date_prevue",
            "poster_a",
            "auteur",
        ):
            self.assertIn(champ, annonce)
        self.assertEqual(annonce["auteur"]["username"], "commu")

    def test_les_plus_recentes_dabord(self):
        Annonce.objects.filter(pk=self.publique.pk).update(
            poster_a=timezone.now() - timezone.timedelta(days=3)
        )
        response = self.client.get("/api/annonces/public/")
        self.assertEqual(response.data[0]["object"], "Réunion stagiaires")

    def test_limite_au_nombre_dannonces(self):
        for index in range(25):
            Annonce.objects.create(
                object=f"Annonce {index}",
                contenu="…",
                auteur=self.auteur,
            )
        response = self.client.get("/api/annonces/public/")
        self.assertEqual(len(response.data), 20)

    def test_endpoint_securise_reste_protege(self):
        # Le CRUD classique reste réservé aux comptes connectés.
        self.assertEqual(self.client.get("/api/annonces/").status_code, 401)

    def test_un_jeton_invalide_ne_bloque_pas_la_page_publique(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer jeton-faux")
        response = self.client.get("/api/annonces/public/")
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data), 0)


@override_settings(STORAGES=LOCAL_STORAGES)
class AnnoncePosterTests(APITestCase):
    """POST /api/annonces/<id>/poster/ — capture de partage de l'annonce."""

    def setUp(self):
        self.media_root = tempfile.mkdtemp(prefix="annonce_poster_")
        self.addCleanup(shutil.rmtree, self.media_root, True)
        self.override = override_settings(MEDIA_ROOT=self.media_root)
        self.override.enable()
        self.addCleanup(self.override.disable)

        self.client = APIClient()
        self.super_admin = User.objects.create_user(
            username="boss", password="motdepasse123", role="super_admin",
        )
        self.commu = User.objects.create_user(
            username="commu", password="motdepasse123", role="admin",
            roles_supplementaires=["communication"],
        )
        self.admin_sans_role = User.objects.create_user(
            username="admin", password="motdepasse123", role="admin",
        )
        self.stagiaire = User.objects.create_user(
            username="eleve", password="motdepasse123", role="stagiaire",
        )
        self.annonce = Annonce.objects.create(
            object="FongoExpo 2026",
            contenu="Venez nombreux.",
            auteur=self.super_admin,
        )

    def poster_url(self, fichier=None, user=None):
        if user is not None:
            self.client.force_authenticate(user=user)
        data = {"poster": fichier} if fichier is not None else {}
        return self.client.post(
            f"/api/annonces/{self.annonce.pk}/poster/", data, format="multipart"
        )

    def test_depose_la_capture(self):
        response = self.poster_url(un_png(), self.super_admin)
        self.assertEqual(response.status_code, 200)
        self.annonce.refresh_from_db()
        self.assertTrue(self.annonce.poster)
        self.assertIn("/media/", response.data["poster"])
        self.assertTrue(
            os.path.exists(os.path.join(self.media_root, self.annonce.poster.name))
        )

    def test_remplace_et_purge_lancienne_capture(self):
        self.assertEqual(self.poster_url(un_png(), self.commu).status_code, 200)
        self.annonce.refresh_from_db()
        ancien = self.annonce.poster.name

        self.assertEqual(
            self.poster_url(un_png(couleur=(8, 145, 178)), self.commu).status_code,
            200,
        )
        self.annonce.refresh_from_db()
        self.assertNotEqual(self.annonce.poster.name, ancien)
        self.assertFalse(os.path.exists(os.path.join(self.media_root, ancien)))
        self.assertTrue(
            os.path.exists(os.path.join(self.media_root, self.annonce.poster.name))
        )

    def test_refuse_un_format_invalide(self):
        fichier = SimpleUploadedFile(
            "virus.exe", b"MZ...", content_type="application/octet-stream"
        )
        self.assertEqual(self.poster_url(fichier, self.super_admin).status_code, 400)

    def test_refuse_un_fichier_trop_lourd(self):
        grosse = SimpleUploadedFile(
            "grosse.png", b"\x89PNG" + b"0" * (6 * 1024 * 1024),
            content_type="image/png",
        )
        self.assertEqual(self.poster_url(grosse, self.super_admin).status_code, 400)

    def test_refuse_un_fichier_qui_nest_pas_une_image(self):
        faux = SimpleUploadedFile("faux.png", b"du texte", content_type="image/png")
        self.assertEqual(self.poster_url(faux, self.super_admin).status_code, 400)

    def test_refuse_une_requete_sans_fichier(self):
        self.assertEqual(self.poster_url(None, self.super_admin).status_code, 400)

    def test_refuse_les_comptes_non_autorises(self):
        self.assertEqual(self.poster_url(un_png()).status_code, 401)
        self.assertEqual(
            self.poster_url(un_png(), self.stagiaire).status_code, 403
        )
        # Un admin sans rôle « communication » ne modifie pas les annonces.
        self.assertEqual(
            self.poster_url(un_png(), self.admin_sans_role).status_code, 403
        )

    def test_annonces_inconnue(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post(
            "/api/annonces/999999/poster/",
            {"poster": un_png()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 404)


class PublicAnnoncePageTests(APITestCase):
    """GET /a/<id>/ — page publique partagée sur WhatsApp / Facebook."""

    def setUp(self):
        self.client = APIClient()
        self.auteur = User.objects.create_user(
            username="commu", password="motdepasse123", role="admin",
            roles_supplementaires=["communication"],
        )
        self.annonce = Annonce.objects.create(
            object="FongoExpo 2026 : inscriptions ouvertes",
            contenu="Venez nombreux assister aux démonstrations.",
            cible="tous",
            auteur=self.auteur,
        )
        self.privee = Annonce.objects.create(
            object="Réunion interne",
            contenu="Réservé aux admins.",
            cible="admins",
            auteur=self.auteur,
        )

    def test_accessible_sans_connexion(self):
        response = self.client.get(f"/a/{self.annonce.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "FongoExpo 2026 : inscriptions ouvertes")

    def test_annonce_admins_invisible(self):
        self.assertEqual(self.client.get(f"/a/{self.privee.pk}/").status_code, 404)

    def test_annonce_inconnue(self):
        self.assertEqual(self.client.get("/a/999999/").status_code, 404)

    def test_balises_open_graph(self):
        response = self.client.get(f"/a/{self.annonce.pk}/")
        self.assertContains(response, 'property="og:title"')
        self.assertContains(response, 'property="og:description"')
        self.assertContains(response, 'property="og:url"')
        self.assertContains(
            response, f'content="http://testserver/a/{self.annonce.pk}/"'
        )
        self.assertContains(response, 'name="twitter:card"')

    def test_aper_utilise_la_capture_de_partage(self):
        Annonce.objects.filter(pk=self.annonce.pk).update(
            poster="annonces/posters/capture.png",
            image1="annonces/affiche.jpg",
        )
        annonce = Annonce.objects.get(pk=self.annonce.pk)
        response = self.client.get(f"/a/{annonce.pk}/")
        # Le stockage renvoie déjà une URL absolue : build_absolute_uri
        # la restitue telle quelle (Supabase en production, /media/ en local).
        self.assertContains(
            response,
            f'property="og:image" content="{annonce.poster.url}"',
        )

    def test_aper_retombe_sur_image1_sans_capture(self):
        Annonce.objects.filter(pk=self.annonce.pk).update(
            image1="annonces/affiche.jpg"
        )
        annonce = Annonce.objects.get(pk=self.annonce.pk)
        response = self.client.get(f"/a/{annonce.pk}/")
        self.assertContains(
            response,
            f'property="og:image" content="{annonce.image1.url}"',
        )

    def test_lien_vers_le_dashboard(self):
        from django.conf import settings

        response = self.client.get(f"/a/{self.annonce.pk}/")
        self.assertContains(response, settings.FRONTEND_BASE_URL)
        self.assertContains(response, "Ouvrir le dashboard")

    def test_contenu_protege_contre_injection(self):
        Annonce.objects.filter(pk=self.annonce.pk).update(
            contenu="<script>alert('xss')</script>"
        )
        response = self.client.get(f"/a/{self.annonce.pk}/")
        self.assertNotContains(response, "<script>alert('xss')</script>")
        self.assertContains(response, "&lt;script&gt;")
