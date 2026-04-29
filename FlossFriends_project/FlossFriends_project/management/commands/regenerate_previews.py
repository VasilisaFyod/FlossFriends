from django.core.management.base import BaseCommand
from django.conf import settings
import json
import os
import uuid
from PIL import Image, ImageDraw
from FlossFriends_project.models import Pattern


def generate_pattern_preview(cells, width, height):
    """Генерирует превью схемы как изображение с сеткой"""
    # Масштабируем превью, чтобы не было больше 600x600px
    max_preview_size = 600
    cell_size = max(1, min(20, max_preview_size // max(width, height, 1)))
    img_width = min(width * cell_size, max_preview_size)
    img_height = min(height * cell_size, max_preview_size)
    image = Image.new('RGB', (img_width, img_height), 'white')
    draw = ImageDraw.Draw(image)
    
    grid_color = (200, 200, 200)  # светло-серые линии
    
    for y, row in enumerate(cells):
        for x, cell in enumerate(row):
            if cell.get('code') is not None:  # не прозрачный
                x1 = x * cell_size
                y1 = y * cell_size
                x2 = x1 + cell_size
                y2 = y1 + cell_size
                draw.rectangle(
                    [x1, y1, x2, y2],
                    fill=(cell['r'], cell['g'], cell['b'])
                )
                # Рисуем сетку
                draw.rectangle([x1, y1, x2 - 1, y2 - 1], outline=grid_color)
    
    return image


class Command(BaseCommand):
    help = 'Перегенерирует превью всех опубликованных схем'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Перегенерировать все схемы, включая приватные',
        )

    def handle(self, *args, **options):
        if options['all']:
            patterns = Pattern.objects.all()
            self.stdout.write("Обновляю все схемы...")
        else:
            patterns = Pattern.objects.filter(is_public=True)
            self.stdout.write("Обновляю опубликованные схемы...")

        count = 0
        errors = 0

        for pattern in patterns:
            try:
                # Парсим pattern_data
                try:
                    pattern_data = json.loads(pattern.pattern_data or "{}")
                except (TypeError, json.JSONDecodeError):
                    pattern_data = {}

                cells = pattern_data.get("cells", [])
                if not cells:
                    self.stdout.write(
                        self.style.WARNING(
                            f"⊘ Схема {pattern.pattern_id} ({pattern.title}) не содержит клеток, пропускаю"
                        )
                    )
                    continue

                # Генерируем новое превью
                preview_image = generate_pattern_preview(
                    cells,
                    pattern.size_width,
                    pattern.size_height
                )

                # Удаляем старое превью если оно существует
                if pattern.image_preview:
                    old_preview_path = os.path.join(settings.MEDIA_ROOT, pattern.image_preview)
                    if os.path.exists(old_preview_path):
                        try:
                            os.remove(old_preview_path)
                        except Exception as e:
                            self.stdout.write(
                                self.style.WARNING(f"  Не смог удалить старое превью: {e}")
                            )

                # Сохраняем новое превью
                preview_filename = f"preview_{uuid.uuid4()}.png"
                preview_dir = os.path.join(settings.MEDIA_ROOT, 'preview')
                os.makedirs(preview_dir, exist_ok=True)
                preview_filepath = os.path.join(preview_dir, preview_filename)
                preview_image.save(preview_filepath, 'PNG')

                # Обновляем модель
                pattern.image_preview = f'preview/{preview_filename}'
                pattern.save(update_fields=['image_preview'])

                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Схема {pattern.pattern_id} ({pattern.title}) обновлена"
                    )
                )
                count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"✗ Ошибка при обновлении схемы {pattern.pattern_id}: {e}")
                )
                errors += 1

        self.stdout.write("\n" + self.style.SUCCESS(f"✓ Готово! Обновлено: {count}"))
        if errors:
            self.stdout.write(self.style.ERROR(f"✗ Ошибок: {errors}"))
