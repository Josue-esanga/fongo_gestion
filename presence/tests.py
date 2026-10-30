"""Tests de la gestion des présences / absences (QR code)."""

from datetime import date
from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase

from fongo_user.models import User
from presence.models import Presence, SeancePresence

SEANCES_URL = "/api/presence/seances/"
SCAN_URL = "/api/presence/scan/"
MA_PRESENCE_URL = "/api/presence/ma-presence/"

# Date de référence fixée dans les tests (mercredi — jour de formation).
JOUR_TEST = date(2026, 11, 4)


def make_user(username, role, **kwargs):
    return User.objects.create_user(
        username=username,
        password="Motdepasse123!",
        role=role,
        **kwargs,
    )


class JourFigeMixin:
    """Fige « aujourd'hui » (seam ``presence.utils.date_du_jour``).

    La règle du lundi au vendredi repose sur ce seam unique : en figeant la
    date, la suite de tests passe quel que soit le jour réel d'exécution.
    """

    def figer_jour(self, jour):
        patcher = patch("presence.utils.date_du_jour", return_value=jour)
        patcher.start()
        self.addCleanup(patcher.stop)


class SeancePresenceTests(JourFigeMixin, APITestCase):

    def setUp(self):
        super().setUp()
        self.figer_jour(JOUR_TEST)

    @classmethod
    def setUpTestData(cls):
        cls.super_admin = make_user("root", "super_admin")
        cls.admin = make_user("admin", "admin")
        cls.stagiaire = make_user("stagiaire1", "stagiaire")
        cls.stagiaire2 = make_user("stagiaire2", "stagiaire")

    def test_demarrage_appel_reserve_hors_stagiaires(self):
        # Un admin peut démarrer un appel.
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(SEANCES_URL, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(response.data["ouverte"])
        self.assertTrue(response.data["qr_payload"].startswith("FONGO-PRESENCE:"))
        # Libellé généré automatiquement.
        self.assertTrue(response.data["libelle"].startswith("Appel du "))
        self.client.force_authenticate(user=None)

        # Un stagiaire ni ne consulte ni ne démarre un appel.
        self.client.force_authenticate(user=self.stagiaire)
        self.assertEqual(
            self.client.get(SEANCES_URL).status_code, status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            self.client.post(SEANCES_URL, {}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_nouveau_appel_cloture_le_precedent(self):
        self.client.force_authenticate(user=self.admin)
        premiere = self.client.post(SEANCES_URL, {}, format="json").data
        deuxieme = self.client.post(SEANCES_URL, {}, format="json").data

        self.assertFalse(SeancePresence.objects.get(id=premiere["id"]).ouverte)
        self.assertTrue(SeancePresence.objects.get(id=deuxieme["id"]).ouverte)
        # Le QR affiché précédemment ne donne plus accès à un scan.
        self.assertFalse(
            SeancePresence.objects.get(id=premiere["id"]).ouverte,
            "L'ancien QR code doit être invalidé.",
        )

    def test_cloture_appel(self):
        self.client.force_authenticate(user=self.admin)
        seance = self.client.post(SEANCES_URL, {}, format="json").data
        response = self.client.post(f"{SEANCES_URL}{seance['id']}/fermer/", {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["ouverte"])

    def test_suppression_reservee_au_superadmin(self):
        self.client.force_authenticate(user=self.admin)
        seance = self.client.post(SEANCES_URL, {}, format="json").data
        url = f"{SEANCES_URL}{seance['id']}/"
        self.assertEqual(
            self.client.delete(url).status_code, status.HTTP_403_FORBIDDEN
        )
        self.client.force_authenticate(user=self.super_admin)
        self.assertEqual(
            self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT
        )


class ScanPresenceTests(JourFigeMixin, APITestCase):

    def setUp(self):
        super().setUp()
        self.figer_jour(JOUR_TEST)

    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.stagiaire = make_user("stagiaire1", "stagiaire")
        cls.stagiaire2 = make_user("stagiaire2", "stagiaire")

    def demarrer_appel(self):
        self.client.force_authenticate(user=self.admin)
        data = self.client.post(SEANCES_URL, {}, format="json").data
        self.client.force_authenticate(user=None)
        return SeancePresence.objects.get(id=data["id"])

    def test_scan_enregistre_une_presence(self):
        seance = self.demarrer_appel()
        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.post(SCAN_URL, {"code": seance.qr_payload}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(response.data["present"])
        self.assertFalse(response.data["deja_enregistre"])
        self.assertIsNotNone(response.data["horodatage"])
        self.assertTrue(
            Presence.objects.filter(seance=seance, stagiaire=self.stagiaire).exists()
        )

        # Second scan du même stagiaire : idempotent.
        response = self.client.post(SCAN_URL, {"code": seance.code}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["deja_enregistre"])
        self.assertEqual(Presence.objects.filter(seance=seance).count(), 1)

    def test_scan_code_inconnu_ou_appel_cloture(self):
        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.post(SCAN_URL, {"code": "inconnu"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        seance = self.demarrer_appel()
        seance.ouverte = False
        seance.save(update_fields=["ouverte"])
        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.post(SCAN_URL, {"code": seance.code}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_scan_refuse_aux_non_stagiaires(self):
        seance = self.demarrer_appel()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(SCAN_URL, {"code": seance.code}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_presences_et_absenses_des_stagiaires(self):
        seance = self.demarrer_appel()
        self.client.force_authenticate(user=self.stagiaire)
        self.client.post(SCAN_URL, {"code": seance.code}, format="json")
        self.client.force_authenticate(user=None)

        # Statut personnel : présent pour l'un, absent pour l'autre.
        self.client.force_authenticate(user=self.stagiaire)
        data = self.client.get(MA_PRESENCE_URL).data
        self.assertTrue(data["present"])
        self.assertTrue(data["appel_ouvert"])

        self.client.force_authenticate(user=self.stagiaire2)
        data = self.client.get(MA_PRESENCE_URL).data
        self.assertFalse(data["present"])
        self.assertTrue(data["appel_ouvert"])

        # Vue côté administrateur : tous les stagiaires et leur statut.
        self.client.force_authenticate(user=self.admin)
        participants = self.client.get(
            f"{SEANCES_URL}{seance.id}/participants/"
        ).data
        self.assertEqual(len(participants), 2)
        statuts = {p["username"]: p for p in participants}
        self.assertTrue(statuts["stagiaire1"]["present"])
        self.assertIsNotNone(statuts["stagiaire1"]["horodatage"])
        self.assertFalse(statuts["stagiaire2"]["present"])
        self.assertIsNone(statuts["stagiaire2"]["horodatage"])

        # Compteurs de la séance.
        detail = self.client.get(f"{SEANCES_URL}{seance.id}/").data
        self.assertEqual(detail["presents"], 1)
        self.assertEqual(detail["absents"], 1)
        self.assertEqual(detail["total_stagiaires"], 2)

    def test_ma_presence_refusee_aux_admins(self):
        self.client.force_authenticate(user=self.admin)
        self.assertEqual(
            self.client.get(MA_PRESENCE_URL).status_code, status.HTTP_403_FORBIDDEN
        )


class RegleJoursOuvresTests(JourFigeMixin, APITestCase):
    """La formation a lieu du lundi au vendredi (QR actif uniquement en semaine)."""

    LUNDI = date(2026, 11, 2)
    VENDREDI = date(2026, 11, 6)
    SAMEDI = date(2026, 10, 31)
    DIMANCHE = date(2026, 11, 1)

    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin_jours", "admin")
        cls.stagiaire = make_user("stagiaire_jours", "stagiaire")

    def test_demarrage_refuse_le_weekend(self):
        self.client.force_authenticate(user=self.admin)
        self.figer_jour(self.SAMEDI)
        response = self.client.post(SEANCES_URL, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn("lundi au vendredi", str(response.data).lower())
        # Aucune séance ne doit avoir été créée (ni l'appel précédent clôturé).
        self.assertEqual(SeancePresence.objects.count(), 0)

    def test_demarrage_autorise_du_lundi_au_vendredi(self):
        self.client.force_authenticate(user=self.admin)
        for jour in (
            date(2026, 11, 2),  # lundi
            date(2026, 11, 3),  # mardi
            JOUR_TEST,  # mercredi
            date(2026, 11, 5),  # jeudi
            self.VENDREDI,  # vendredi
        ):
            with self.subTest(jour=jour):
                self.figer_jour(jour)
                response = self.client.post(SEANCES_URL, {}, format="json")
                self.assertEqual(
                    response.status_code, status.HTTP_201_CREATED, response.data
                )
                self.assertEqual(response.data["date"], jour.isoformat())

    def test_scan_refuse_le_weekend_meme_si_appel_ouvert(self):
        # Appel ouvert un mercredi…
        self.client.force_authenticate(user=self.admin)
        self.figer_jour(JOUR_TEST)
        data = self.client.post(SEANCES_URL, {}, format="json").data
        seance = SeancePresence.objects.get(id=data["id"])
        self.assertTrue(seance.ouverte)

        # …mais scanné le samedi : refus, aucune présence enregistrée.
        self.figer_jour(self.SAMEDI)
        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.post(
            SCAN_URL, {"code": seance.qr_payload}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn("lundi au vendredi", str(response.data).lower())
        self.assertFalse(Presence.objects.filter(seance=seance).exists())

    def test_scan_autorise_un_vendredi(self):
        self.client.force_authenticate(user=self.admin)
        self.figer_jour(self.VENDREDI)
        data = self.client.post(SEANCES_URL, {}, format="json").data

        self.client.force_authenticate(user=self.stagiaire)
        response = self.client.post(
            SCAN_URL, {"code": data["qr_payload"]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_ma_presence_sans_appel_le_weekend(self):
        self.client.force_authenticate(user=self.admin)
        self.figer_jour(JOUR_TEST)
        self.client.post(SEANCES_URL, {}, format="json")

        self.client.force_authenticate(user=self.stagiaire)
        self.assertTrue(self.client.get(MA_PRESENCE_URL).data["appel_ouvert"])

        # Dimanche : l'appel resté ouvert n'est plus signalé (aucun scan possible).
        self.figer_jour(self.DIMANCHE)
        self.assertFalse(self.client.get(MA_PRESENCE_URL).data["appel_ouvert"])

    def test_liste_des_seances_classee_et_filtree_par_jour(self):
        self.client.force_authenticate(user=self.admin)
        self.figer_jour(date(2026, 11, 3))  # mardi
        mardi = self.client.post(SEANCES_URL, {}, format="json").data
        self.figer_jour(JOUR_TEST)  # mercredi
        mercredi = self.client.post(SEANCES_URL, {}, format="json").data

        def extraire(resultat):
            # La liste peut être paginée ({"results": [...]}) ou directe.
            if isinstance(resultat, dict) and "results" in resultat:
                return resultat["results"]
            return resultat

        data = extraire(self.client.get(f"{SEANCES_URL}?jour=2026-11-03").data)
        self.assertEqual([item["id"] for item in data], [mardi["id"]])
        self.assertEqual(data[0]["jour_semaine"], "mardi")

        data = extraire(self.client.get(f"{SEANCES_URL}?jour=2026-11-04").data)
        self.assertEqual([item["id"] for item in data], [mercredi["id"]])
        self.assertEqual(data[0]["jour_semaine"], "mercredi")

        # Format de jour invalide →400 explicite.
        self.assertEqual(
            self.client.get(f"{SEANCES_URL}?jour=invalide").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
