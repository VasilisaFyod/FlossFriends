from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
import uuid


class Palette(models.Model):
    palette_id = models.AutoField(primary_key=True)
    name_palette = models.CharField(unique=True, max_length=50, db_collation='Cyrillic_General_CI_AS')

    class Meta:
        db_table = 'Palette'

class Canvas(models.Model):
    canvas_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    count_per_cm = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        db_table = 'Canvas'

class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'Category'

    
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
    is_public = models.BooleanField(null=True, blank=True)
    categories = models.ManyToManyField(
        Category,
        through='PatternCategory',
        related_name='patterns'
    )
    def delete(self, *args, **kwargs):
        # Delete files from MEDIA_ROOT for both new and legacy stored paths.
        import os
        from django.conf import settings

        def delete_media_file(file_value, fallback_dir=None):
            if not file_value:
                return

            normalized = str(file_value).lstrip("/\\")
            candidates = [os.path.join(settings.MEDIA_ROOT, normalized)]

            # Legacy rows may store only basename, e.g. "abc.png".
            if fallback_dir and os.path.basename(normalized) == normalized:
                candidates.append(os.path.join(settings.MEDIA_ROOT, fallback_dir, normalized))

            for candidate in candidates:
                if os.path.exists(candidate):
                    os.remove(candidate)
                    break

        delete_media_file(self.image_original, "original")
        delete_media_file(self.image_preview, "preview")
        super().delete(*args, **kwargs)

    class Meta:
        db_table = 'Pattern'

class PatternCategory(models.Model):
    patterncategory_id = models.AutoField(primary_key=True)
    pattern = models.ForeignKey(Pattern, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    class Meta:
        db_table = 'PatternCategory'

class Favorite(models.Model):
    favorite_id = models.AutoField(primary_key=True)
    pattern = models.ForeignKey(
        Pattern,
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_date = models.DateTimeField()

    class Meta:
        db_table = 'Favorite'
        unique_together = (('pattern', 'user'),)

class Like(models.Model):
    like_id = models.AutoField(primary_key=True)
    pattern = models.ForeignKey(
        Pattern,
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_date = models.DateTimeField()

    class Meta:
        db_table = 'Like'
        unique_together = (('pattern', 'user'),)

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
        db_table = 'Thread'
        unique_together = (('palette', 'code'),)


class Threadinventory(models.Model):
    thread_inventory_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE)
    skeins_count = models.IntegerField()

    class Meta:
        db_table = 'ThreadInventory'
       


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
        db_table = 'sysdiagrams'
        unique_together = (('principal_id', 'name'),)

