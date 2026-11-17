from django.db import migrations


def clear_user_emails(apps, schema_editor):
    User = apps.get_model("fongo_user", "User")
    User.objects.exclude(email="").update(email="")


class Migration(migrations.Migration):

    dependencies = [
        ("fongo_user", "0006_user_roles_supplementaires"),
    ]

    operations = [
        migrations.RunPython(clear_user_emails, migrations.RunPython.noop),
    ]
