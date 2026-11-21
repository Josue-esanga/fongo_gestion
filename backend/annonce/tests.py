"""Tests des annonces : endpoint public de la page d'accueil."""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.test import APITestCase

from .models import Annonce

User = get_user_model()


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
