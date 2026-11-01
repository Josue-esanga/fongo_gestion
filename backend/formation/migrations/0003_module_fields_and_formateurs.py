import django.db.models.deletion
from django.db import migrations, models


def forwards(apps, schema_editor):
    """Reprend l'ancien lien unique vers un formateur en relation multiple."""
    Module = apps.get_model("formation", "Module")
    for index, module in enumerate(Module.objects.order_by("id"), start=1):
        module.ordre = index
        module.save(update_fields=["ordre"])
        if module.id_formateur_id:
            module.formateurs.add(module.id_formateur_id)


def backwards(apps, schema_editor):
    Module = apps.get_model("formation", "Module")
    for module in Module.objects.order_by("id"):
        premier_formateur = module.formateurs.order_by("id").first()
        if premier_formateur:
            module.id_formateur_id = premier_formateur.id
            module.save(update_fields=["id_formateur"])


class Migration(migrations.Migration):

    dependencies = [
        ("formation", "0002_alter_formateur_user"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="module",
            options={"ordering": ("ordre", "id")},
        ),
        migrations.RenameField(
            model_name="module",
            old_name="cours",
            new_name="titre",
        ),
        migrations.AlterField(
            model_name="module",
            name="titre",
            field=models.CharField(max_length=120),
        ),
        migrations.AlterField(
            model_name="module",
            name="duree",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="module",
            name="ordre",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="module",
            name="sujets",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="module",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        # Rendre l'ancien lien nullable pour pouvoir le retirer proprement.
        migrations.AlterField(
            model_name="module",
            name="id_formateur",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="formation.formateur",
            ),
        ),
        migrations.AddField(
            model_name="module",
            name="formateurs",
            field=models.ManyToManyField(
                blank=True,
                related_name="modules",
                to="formation.formateur",
            ),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.RemoveField(
            model_name="module",
            name="id_formateur",
        ),
    ]
