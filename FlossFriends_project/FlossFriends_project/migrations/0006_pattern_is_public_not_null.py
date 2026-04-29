from django.db import migrations, models


def fill_null_is_public(apps, schema_editor):
    Pattern = apps.get_model("FlossFriends_project", "Pattern")
    Pattern.objects.filter(is_public__isnull=True).update(is_public=False)


class Migration(migrations.Migration):

    dependencies = [
        ("FlossFriends_project", "0005_threadinventory_store_cm"),
    ]

    operations = [
        migrations.RunPython(fill_null_is_public, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="pattern",
            name="is_public",
            field=models.BooleanField(default=False),
        ),
    ]
