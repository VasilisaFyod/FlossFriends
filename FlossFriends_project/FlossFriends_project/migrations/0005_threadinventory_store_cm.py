from django.db import migrations, models


SKEIN_LENGTH_CM = 800


def convert_skeins_to_cm(apps, schema_editor):
    Threadinventory = apps.get_model('FlossFriends_project', 'Threadinventory')
    for item in Threadinventory.objects.all().only('thread_inventory_id', 'skeins_count', 'length_cm'):
        item.length_cm = int(item.skeins_count or 0) * SKEIN_LENGTH_CM
        item.save(update_fields=['length_cm'])


def convert_cm_to_skeins(apps, schema_editor):
    Threadinventory = apps.get_model('FlossFriends_project', 'Threadinventory')
    for item in Threadinventory.objects.all().only('thread_inventory_id', 'skeins_count', 'length_cm'):
        item.skeins_count = int(item.length_cm or 0) // SKEIN_LENGTH_CM
        item.save(update_fields=['skeins_count'])


class Migration(migrations.Migration):

    dependencies = [
        ('FlossFriends_project', '0004_remove_colors_count'),
    ]

    operations = [
        migrations.AddField(
            model_name='threadinventory',
            name='length_cm',
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
        migrations.RunPython(convert_skeins_to_cm, convert_cm_to_skeins),
        migrations.RemoveField(
            model_name='threadinventory',
            name='skeins_count',
        ),
    ]
