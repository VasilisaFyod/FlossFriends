from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("FlossFriends_project", "0006_pattern_is_public_not_null"),
    ]

    operations = [
        migrations.RenameField(
            model_name="palette",
            old_name="name_palette",
            new_name="name",
        ),
    ]
