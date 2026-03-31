from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
import uuid


class Palette(models.Model):
    palette_id = models.AutoField(primary_key=True)
    name_palette = models.CharField(unique=True, max_length=50, db_collation='Cyrillic_General_CI_AS')

class Canvas(models.Model):
    canvas_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    count_per_cm = models.DecimalField(max_digits=5, decimal_places=2)

class Pattern(models.Model):
    pattern_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    canvas = models.ForeignKey('Canvas', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    image_original = models.CharField(max_length=255)
    image_preview = models.CharField(max_length=255)
    pattern_data = models.TextField()
    size_width = models.IntegerField()
    size_height = models.IntegerField()
    created_date = models.DateTimeField()
    updated_date = models.DateTimeField(null=True, blank=True)
    colors_count = models.IntegerField()

class Thread(models.Model):
    thread_id = models.IntegerField(primary_key=True)
    palette = models.ForeignKey(Palette, on_delete=models.CASCADE)
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    rgb_r = models.IntegerField()
    rgb_g = models.IntegerField()
    rgb_b = models.IntegerField()
    hex_value = models.CharField(max_length=7)

    class Meta:
        unique_together = (('palette', 'code'),)

class Threadcalculation(models.Model):
    thread_calculation_id = models.AutoField(primary_key=True)
    pattern = models.ForeignKey(Pattern, on_delete=models.CASCADE)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE)
    crosses_count = models.IntegerField()
    length_cm = models.DecimalField(max_digits=10, decimal_places=2)
    symbol = models.CharField(max_length=10)

    class Meta:
        unique_together = (('pattern', 'thread'),)

class Threadinventory(models.Model):
    thread_inventory_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE)
    skeins_count = models.IntegerField()

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)

    def __str__(self):
        return self.username

class Sysdiagrams(models.Model):
    name = models.CharField(max_length=128, db_collation='Cyrillic_General_CI_AS')
    principal_id = models.IntegerField()
    diagram_id = models.AutoField(primary_key=True)
    version = models.IntegerField(blank=True, null=True)
    definition = models.BinaryField(blank=True, null=True)

    class Meta:
        unique_together = (('principal_id', 'name'),)
