from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("FlossFriends_project", "0007_rename_palette_name_field"),
    ]

    operations = [
        migrations.RenameField(
            model_name="pattern",
            old_name="created_date",
            new_name="created_at",
        ),
        migrations.RenameField(
            model_name="pattern",
            old_name="updated_date",
            new_name="updated_at",
        ),
        migrations.RenameField(
            model_name="favorite",
            old_name="created_date",
            new_name="created_at",
        ),
        migrations.RenameField(
            model_name="patterncategory",
            old_name="patterncategory_id",
            new_name="pattern_category_id",
        ),
    ]
