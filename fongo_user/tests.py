"""Tests des droits d'accès par rôle (rôles supplémentaires inclus).

Matrice attendue :
- super_admin : CRUD sur tout ;
- admin + « formateur » : CRUD sur les devoirs uniquement ;
- admin + « caissier » : CRUD sur la finance uniquement ;
- admin simple : lecture seule ;
- stagiaire : lecture seule (ses propres paiements), accès restreint (pas
  d'annuaire des membres, pas de modules pédagogiques) et profil limité à sa
  photo.
"""

from django.test import RequestFactory
from rest_framework import status
from rest_framework.test import APITestCase

from fongo_user.models import User
from fongo_user.serializers import UserSerializer


def make_user(username, role, **kwargs):
    return User.objects.create_user(
        username=username,
        password="Motdepasse123!",
        role=role,
        **kwargs,
    )


class RolePermissionsTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.super_admin = make_user("root", "super_admin")
        cls.admin = make_user("admin", "admin")
        cls.formateur = make_user("formateur", "admin", roles_supplementaires=["formateur"])
        cls.caissier = make_user("caissier", "admin", roles_supplementaires=["caissier"])
        cls.stagiaire = make_user("stagiaire", "stagiaire")
        cls.autre_stagiaire = make_user("stagiaire2", "stagiaire")

    # --- Membres : réservés au super administrateur ---

    def test_membres_ecriture_reservee_au_superadmin(self):
        payload = {
            "username": "nouveau",
            "password": "Motdepasse123!",
            "role": "stagiaire",
        }
        for user in (self.admin, self.formateur, self.caissier):
            self.client.force_authenticate(user=user)
            response = self.client.post("/api/users/", payload, format="json")
            self.assertEqual(
                response.status_code,
                status.HTTP_403_FORBIDDEN,
                f"{user.username} ne doit pas pouvoir créer un membre.",
            )
            self.client.force_authenticate(user=None)

        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post("/api/users/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_membres_lecture_interdite_aux_stagiaires(self):
        # Un admin consulte l'annuaire.
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.force_authenticate(user=None)

        # Un stagiaire n'y a pas accès.
        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --- Profil : un stagiaire ne modifie que sa photo ---

    def test_stagiaire_ne_peut_pas_modifier_son_profil(self):
        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.patch(
            "/api/auth/me/", {"first_name": "Hacker"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.stagiaire.refresh_from_db()
        self.assertNotEqual(self.stagiaire.first_name, "Hacker")

    def test_admin_peut_modifier_son_profil(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            "/api/auth/me/", {"first_name": "Patrick"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.first_name, "Patrick")

    def test_stagiaire_peut_modifier_sa_photo(self):
        """Champ autorisé : ``pictures`` (aucun fichier envoyé ici)."""
        from fongo_user.serializers import ProfileSerializer

        request = RequestFactory().patch("/api/auth/me/")
        request.user = self.stagiaire
        serializer = ProfileSerializer(
            instance=self.stagiaire,
            data={"pictures": None},
            context={"request": request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # --- Rôles supplémentaires : super admin uniquement ---

    def test_attribution_roles_supplementaires(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.patch(
            f"/api/users/{self.admin.id}/",
            {"roles_supplementaires": '["formateur","caissier"]'},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin.refresh_from_db()
        self.assertEqual(
            self.admin.roles_supplementaires, ["formateur", "caissier"]
        )

    def test_attribution_roles_supplementaires_multipart(self):
        """L'interface envoie les rôles sous forme de JSON en multipart."""
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.patch(
            f"/api/users/{self.formateur.id}/",
            {"roles_supplementaires": '["formateur","caissier"]'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.formateur.refresh_from_db()
        self.assertEqual(
            self.formateur.roles_supplementaires, ["formateur", "caissier"]
        )

    def test_roles_supplementaires_rejetes_sans_superadmin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/users/{self.admin.id}/",
            {"roles_supplementaires": '["caissier"]'},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.roles_supplementaires, [])

    def test_roles_supplementaires_ignores_hors_admin(self):
        """Un stagiaire ou un super admin ne porte pas de rôle supplémentaire."""
        request = RequestFactory().post("/api/users/")
        request.user = self.super_admin
        serializer = UserSerializer(
            data={
                "username": "stagiaire3",
                "password": "Motdepasse123!",
                "role": "stagiaire",
                "roles_supplementaires": '["formateur"]',
            },
            context={"request": request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.roles_supplementaires, [])

    def test_roles_supplementaires_invalides_rejetes(self):
        request = RequestFactory().post("/api/users/")
        request.user = self.super_admin
        serializer = UserSerializer(
            data={
                "username": "admin2",
                "password": "Motdepasse123!",
                "role": "admin",
                "roles_supplementaires": '["super_heros"]',
            },
            context={"request": request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("roles_supplementaires", serializer.errors)

    # --- Devoirs : super admin + admins formateurs ---

    def test_devoirs_cro_acces(self):
        payload = {
            "title": "Exercice 1",
            "description": "Répondre aux questions.",
            "limit_date": "2030-01-01T10:00:00Z",
        }
        attendus = {
            self.super_admin: status.HTTP_201_CREATED,
            self.formateur: status.HTTP_201_CREATED,
            self.admin: status.HTTP_403_FORBIDDEN,
            self.caissier: status.HTTP_403_FORBIDDEN,
            self.stagiaire: status.HTTP_403_FORBIDDEN,
        }
        for user, attendu in attendus.items():
            self.client.force_authenticate(user=user)
            response = self.client.post("/api/devoirs/", payload, format="json")
            self.assertEqual(
                response.status_code,
                attendu,
                f"création d'un devoir pour {user.username} : {response.status_code}",
            )
            self.client.force_authenticate(user=None)

    def test_devoirs_lecture_ouverte(self):
        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.get("/api/devoirs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --- Finance : super admin + admins caissiers ---

    def test_finance_cro_acces(self):
        payload = {
            "montant": 50_000,
            "category": "module",
            "description": "Frais de module",
            "id_stagiaire": self.stagiaire.id,
        }
        attendus = {
            self.super_admin: status.HTTP_201_CREATED,
            self.caissier: status.HTTP_201_CREATED,
            self.admin: status.HTTP_403_FORBIDDEN,
            self.formateur: status.HTTP_403_FORBIDDEN,
            self.stagiaire: status.HTTP_403_FORBIDDEN,
        }
        for user, attendu in attendus.items():
            self.client.force_authenticate(user=user)
            response = self.client.post("/api/finance/paiements/", payload, format="json")
            self.assertEqual(
                response.status_code,
                attendu,
                f"création d'un paiement pour {user.username} : {response.status_code}",
            )
            self.client.force_authenticate(user=None)

    def test_finance_liste_reservee_aux_caissiers(self):
        from finance.models import Ajout_Argent

        Ajout_Argent.objects.create(
            montant=10_000,
            category="module",
            description="Cotisation",
            id_stagiaire=self.stagiaire,
        )

        # Un caissier voit tous les versements.
        self.client.force_authenticate(user=self.caissier)
        response = self.client.get("/api/finance/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.client.force_authenticate(user=None)

        # Un stagiaire ne voit que les siens.
        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.get("/api/finance/paiements/")
        self.assertEqual(response.data["count"], 1)
        self.client.force_authenticate(user=None)

        # Un admin sans rôle caissier ne voit aucun versement.
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/finance/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    # --- Planning / annonces / formation / paramètres : super admin ---

    def test_planning_ecriture_reservee_au_superadmin(self):
        payload = {
            "title": "Réunion",
            "description": "Comité.",
            "date": "2030-01-01T14:00:00Z",
            "dirigent_id": self.admin.id,
        }
        for user in (self.admin, self.formateur, self.caissier, self.stagiaire):
            self.client.force_authenticate(user=user)
            response = self.client.post("/api/planning/events/", payload, format="json")
            self.assertEqual(
                response.status_code,
                status.HTTP_403_FORBIDDEN,
                f"{user.username} ne doit pas gérer le planning.",
            )
            self.client.force_authenticate(user=None)

        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post("/api/planning/events/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_configuration_lecture_ouverte_ecriture_superadmin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/parametre/configuration/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.patch(
            "/api/parametre/configuration/1/",
            {"frais_formation": 200_000},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=None)

        self.client.force_authenticate(user=self.super_admin)
        response = self.client.patch(
            "/api/parametre/configuration/1/",
            {"frais_formation": 200_000},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
