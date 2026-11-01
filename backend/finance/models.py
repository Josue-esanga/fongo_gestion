from django.db import models

from fongo_user.models import User


class Ajout_Argent(models.Model):
    CATEGORIES = [
        ("module", "Module de formation"),
        ("autres", "Autre frais"),
    ]
    MOYENS = [
        ("cash", "Espèces"),
        ("lumicash", "Lumicash"),
    ]
    STATUTS = [
        ("valide", "Validé"),
        ("en_attente", "En attente"),
        ("refuse", "Refusé"),
    ]

    montant = models.IntegerField(null=False, blank=False)
    # La catégorie est déduite du module choisi : un paiement peut aussi
    # concerner un autre frais (inscription, cotisation, matériel, etc.).
    category = models.CharField(
        max_length=20,
        choices=CATEGORIES,
        null=False,
        default="autres",
    )
    module = models.ForeignKey(
        "formation.Module",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="paiements",
    )
    moyen = models.CharField(max_length=20, choices=MOYENS, default="cash")
    statut = models.CharField(max_length=20, choices=STATUTS, default="valide")
    description = models.CharField(max_length=100, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    id_stagiaire = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "stagiaire"},
        related_name="ajout_argent_stagiaire",
    )

    def __str__(self):
        cible = self.module.titre if self.module_id else self.get_category_display()
        return (
            f"{self.id_stagiaire} - {self.montant} - {cible} - "
            f"{self.get_statut_display()} - "
            f"{self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
        )
