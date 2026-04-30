from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("FlossFriends_project", "0008_rename_model_and_timestamp_fields"),
    ]

    operations = [
        migrations.RenameField(
            model_name="like",
            old_name="created_date",
            new_name="created_at",
        ),
    ]
