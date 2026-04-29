from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('FlossFriends_project', '0003_auto_20260427_1533'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pattern',
            name='colors_count',
        ),
    ]
