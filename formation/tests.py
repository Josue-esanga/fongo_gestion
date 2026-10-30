"""Tests de l'option « Modules » (grille pédagogique)."""

from rest_framework import status
from rest_framework.test import APITestCase

from fongo_user.models import User
from formation.models import ModulePedagogique


def make_user(username, role, **kwargs):
    return User.objects.create_user(
        username=username,
        password="Motdepasse123!",
        role=role,
        **kwargs,
    )


class ModulePedagogiqueTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.super_admin = make_user("root", "super_admin")
        cls.admin = make_user("admin", "admin")
        cls.formateur = make_user(
            "formateur", "admin", roles_supplementaires=["formateur"]
        )
        cls.caissier = make_user("caissier", "admin", roles_supplementaires=["caissier"])
        cls.stagiaire = make_user("stagiaire", "stagiaire")

    def test_grille_initialisee(self):
        """Les trois modules de base sont présents après la migration."""
        titres = list(
            ModulePedagogique.objects.order_by("ordre").values_list(
                "titre", flat=True
            )
        )
        self.assertEqual(
            titres, ["Premier module", "Deuxième module", "Troisième module"]
        )
        premier = ModulePedagogique.objects.get(ordre=1)
        self.assertEqual(premier.sujets, ["HTML5", "CSS3"])

    def test_lecture_autorisee_hors_stagiaires(self):
        for user in (self.super_admin, self.admin, self.formateur, self.caissier):
            self.client.force_authenticate(user=user)
            response = self.client.get("/api/formation/programme/")
            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
                f"{user.username} doit pouvoir consulter les modules.",
            )
            self.client.force_authenticate(user=None)

        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.get("/api/formation/programme/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ecriture_reservee_au_superadmin(self):
        payload = {"ordre": 4, "titre": "Quatrième module", "sujets": ["React"]}
        for user in (self.admin, self.formateur, self.caissier, self.stagiaire):
            self.client.force_authenticate(user=user)
            response = self.client.post(
                "/api/formation/programme/", payload, format="json"
            )
            self.assertEqual(
                response.status_code,
                status.HTTP_403_FORBIDDEN,
                f"{user.username} ne doit pas créer de module.",
            )
            self.client.force_authenticate(user=None)

        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post(
            "/api/formation/programme/", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ModulePedagogique.objects.filter(titre="Quatrième module").exists()
        )

    def test_sujets_acceptes_json_et_texte(self):
        """L'interface envoie les sujets en JSON ; un texte brut reste toléré."""
        self.client.force_authenticate(user=self.super_admin)

        # Chemin de l'interface : chaîne JSON envoyée en multipart.
        response = self.client.post(
            "/api/formation/programme/",
            {"ordre": 5, "titre": "Test", "sujets": '["HTML5","CSS3"]'},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(
            ModulePedagogique.objects.get(titre="Test").sujets, ["HTML5", "CSS3"]
        )

        # Texte brut : un sujet par ligne.
        response = self.client.post(
            "/api/formation/programme/",
            {"ordre": 6, "titre": "Test 2", "sujets": "HTML5\nCSS3"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(
            ModulePedagogique.objects.get(titre="Test 2").sujets, ["HTML5", "CSS3"]
        )
