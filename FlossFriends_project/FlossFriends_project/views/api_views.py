from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required 
import uuid
import json
import os
from django.utils import timezone
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import base64
from PIL import Image, ImageDraw

from ..models import Pattern, Palette, Thread, Canvas, Threadcalculation
from ..services.pattern_generator import generate_pattern

def generate_pattern_preview(cells, width, height):
    """Генерирует превью схемы как изображение"""
    cell_size = 10  # пикселей на клетку
    img_width = width * cell_size
    img_height = height * cell_size
    image = Image.new('RGB', (img_width, img_height), 'white')
    draw = ImageDraw.Draw(image)
    
    for y, row in enumerate(cells):
        for x, cell in enumerate(row):
            if cell.get('code') is not None:  # не прозрачный
                draw.rectangle(
                    [x * cell_size, y * cell_size, (x + 1) * cell_size, (y + 1) * cell_size],
                    fill=(cell['r'], cell['g'], cell['b'])
                )
    
    return image

@csrf_exempt
def generate_pattern_api(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        result = generate_pattern(
            image_base64=data["image"],
            width=int(data["width"]),
            height=int(data["height"]),
            colors=int(data["colors"]),
            palette_name=data["palette"],
            count_per_cm=float(data.get("count_per_cm", 5.5))
        )
        return JsonResponse(result)
    except Exception as e:
        # 🔹 Печатаем полный traceback в консоль
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def get_palette_max_colors(request):
    palette_name = request.GET.get("palette", "")

    try:
        palette = Palette.objects.get(name_palette__iexact=palette_name)

        max_colors = Thread.objects.filter(palette=palette).count()

        return JsonResponse({"max_colors": max_colors})

    except Palette.DoesNotExist:
        return JsonResponse({"max_colors": 0})

def get_canvas_list(request):
    canvases = Canvas.objects.all().values("name", "count_per_cm")
    return JsonResponse(list(canvases), safe=False)

@csrf_exempt
def save_pattern_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
        user = request.user
        canvas = Canvas.objects.filter(name=data.get("canvas")).first()
        if not canvas or not user.is_authenticated:
            return JsonResponse({"error": "User or canvas not found"}, status=400)

        # сохраняем изображение
        filename = None
        if data.get("image"):
            format, imgstr = data["image"].split(';base64,')
            ext = format.split('/')[-1]
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = os.path.join(settings.MEDIA_ROOT, filename)

            with open(filepath, "wb") as f:
                f.write(base64.b64decode(imgstr))


        pattern = Pattern.objects.create(
            user=user,
            canvas=canvas,
            title=data.get("title", "Без названия"),
            image_original=filename,
            image_preview=filename,  # временно
            pattern_data=json.dumps({"cells": data["cells"]}),
            size_width=data["width"],
            size_height=data["height"],
            created_date=timezone.now(),
            colors_count=len(data.get("legend", []))
        )

        # Генерируем превью схемы
        cells = data["cells"]
        preview_image = generate_pattern_preview(cells, data["width"], data["height"])
        preview_filename = f"preview_{uuid.uuid4()}.png"
        preview_filepath = os.path.join(settings.MEDIA_ROOT, preview_filename)
        preview_image.save(preview_filepath, 'PNG')
        pattern.image_preview = preview_filename
        pattern.save()

        # сохраняем легенду с символами
        for item in data.get("legend", []):
            thread = Thread.objects.filter(
                palette__name_palette__iexact=data.get("palette"),
                code=item["code"]
            ).first()
            if not thread:
                continue

            Threadcalculation.objects.create(
                pattern=pattern,
                thread=thread,
                crosses_count=item.get("count", 0),
                length_cm=item.get("length_cm", 0),
                symbol=item.get("symbol", "?")  # символ CharField теперь
            )

        return JsonResponse({"id": pattern.pattern_id})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

def get_pattern_api(request, pattern_id):
    try:
        pattern = Pattern.objects.get(pattern_id=pattern_id)
        pattern_data = json.loads(pattern.pattern_data)
        cells = pattern_data.get("cells", [])

        legend = []
        calculations = Threadcalculation.objects.filter(pattern=pattern)
        for calc in calculations:
            t = calc.thread
            legend.append({
                "code": t.code,
                "name": t.name,
                "r": t.rgb_r,
                "g": t.rgb_g,
                "b": t.rgb_b,
                "symbol": calc.symbol,  # читаем символ напрямую
                "count": calc.crosses_count,
                "length_cm": float(calc.length_cm)
            })

        image_url = settings.MEDIA_URL + pattern.image_preview
        return JsonResponse({
            "cells": cells,
            "legend": legend,
            "width": pattern.size_width,
            "height": pattern.size_height,
            "image": image_url
        })

    except Pattern.DoesNotExist:
        return JsonResponse({"error": "Pattern not found"}, status=404)
    
@csrf_exempt
@login_required
def update_pattern_api(request, pattern_id):
    if request.method != "PUT":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)

    pattern = get_object_or_404(
        Pattern,
        pattern_id=pattern_id,
        user=request.user
    )

    pattern.title = data.get("title", pattern.title)
    pattern.pattern_data = json.dumps({
        "cells": data.get("cells", [])
    })

    # 🔹 Обеспечиваем, чтобы width и height > 0
    pattern.size_width = max(int(data.get("width", pattern.size_width)), 1)
    pattern.size_height = max(int(data.get("height", pattern.size_height)), 1)

    # 🔹 Безопасное присваивание colors_count
    legend_count = len(data.get("legend", []))
    pattern.colors_count = max(legend_count, 1)  # минимум 1, чтобы не падал CHECK

    pattern.updated_date = timezone.now()
    pattern.save()

    # Генерируем новое превью схемы
    cells = data.get("cells", [])
    if cells:
        preview_image = generate_pattern_preview(cells, pattern.size_width, pattern.size_height)
        preview_filename = f"preview_{uuid.uuid4()}.png"
        preview_filepath = os.path.join(settings.MEDIA_ROOT, preview_filename)
        preview_image.save(preview_filepath, 'PNG')
        # Удаляем старое превью, если оно не оригинал
        if pattern.image_preview and pattern.image_preview != pattern.image_original:
            old_preview_path = os.path.join(settings.MEDIA_ROOT, pattern.image_preview)
            if os.path.exists(old_preview_path):
                os.remove(old_preview_path)
        pattern.image_preview = preview_filename
        pattern.save()

    # Удаляем старые расчеты ниток и сохраняем новые
    Threadcalculation.objects.filter(pattern=pattern).delete()
    for item in data.get("legend", []):
        thread = Thread.objects.filter(
            palette__name_palette__iexact=data.get("palette"),
            code=item["code"]
        ).first()

        if not thread:
            continue

        Threadcalculation.objects.create(
            pattern=pattern,
            thread=thread,
            crosses_count=item.get("count", 0),
            length_cm=item.get("length_cm", 0),
            symbol=item.get("symbol", "?")
        )

    return JsonResponse({"id": pattern.pattern_id})



