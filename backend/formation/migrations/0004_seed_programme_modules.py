from django.db import migrations

# Programme de démarrage : trois modules avec leurs sujets et leurs logos.
PROGRAMME = [
    {
        "ordre": 1,
        "titre": "HTML5 & CSS3",
        "duree": 20,
        "sujets": ["HTML5", "CSS3"],
        "description": (
            "Structurer des pages web modernes avec HTML5 et les mettre en "
            "forme avec CSS3."
        ),
    },
    {
        "ordre": 2,
        "titre": "JavaScript",
        "duree": 20,
        "sujets": ["JavaScript"],
        "description": (
            "Ajouter de l'interactivité et de la dynamique aux pages web "
            "avec JavaScript."
        ),
    },
    {
        "ordre": 3,
        "titre": "Python, POO et Django",
        "duree": 30,
        "sujets": ["Python", "Programmation orientée objet (POO)", "Django"],
        "description": (
            "Apprendre Python, maîtriser la programmation orientée objet et "
            "développer des applications web avec Django."
        ),
    },
]


def seed_modules(apps, schema_editor):
    """Ajoute les modules du programme s'ils n'existent pas déjà."""
    Module = apps.get_model("formation", "Module")
    for data in PROGRAMME:
        defaults = {key: value for key, value in data.items() if key != "titre"}
        Module.objects.get_or_create(titre=data["titre"], defaults=defaults)


class Migration(migrations.Migration):

    dependencies = [
        ("formation", "0003_module_fields_and_formateurs"),
    ]

    operations = [
        migrations.RunPython(seed_modules, migrations.RunPython.noop),
    ]
