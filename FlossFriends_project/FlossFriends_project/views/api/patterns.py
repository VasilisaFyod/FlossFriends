import base64
import json
import math
import os
import uuid

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from PIL import Image, ImageDraw

from ...models import Canvas, Palette, Pattern, Thread
from ...services.pattern_generator import generate_pattern


def _normalize_pattern_thread_code(code, palette_name):
    code_text = str(code or "").strip()
    if "-" in code_text:
        parts = code_text.split("-", 1)
        palette_part = parts[0].strip()
        code_part = parts[1].strip()
        if palette_part and code_part:
            return palette_part, code_part

    palette_text = str(palette_name or "").strip()
    prefix = f"{palette_text}-"
    if palette_text and code_text.lower().startswith(prefix.lower()):
        return palette_text, code_text[len(prefix):]
    return palette_text or "DMC", code_text


def _sync_inventory_for_pattern(user, old_payload, new_payload):
    # Инвентарь не списываем автоматически.
    return None


def generate_pattern_preview(cells, width, height):
    max_preview_size = 600
    cell_size = max(1, min(20, max_preview_size // max(width, height, 1)))
    img_width = min(width * cell_size, max_preview_size)
    img_height = min(height * cell_size, max_preview_size)
    image = Image.new("RGB", (img_width, img_height), "white")
    draw = ImageDraw.Draw(image)

    grid_color = (200, 200, 200)

    for y, row in enumerate(cells):
        for x, cell in enumerate(row):
            if cell.get("code") is not None:
                x1 = x * cell_size
                y1 = y * cell_size
                x2 = x1 + cell_size
                y2 = y1 + cell_size
                draw.rectangle(
                    [x1, y1, x2, y2],
                    fill=(cell["r"], cell["g"], cell["b"]),
                )
                draw.rectangle([x1, y1, x2 - 1, y2 - 1], outline=grid_color)

    return image


@csrf_exempt
def generate_pattern_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body or "{}")

        image_base64 = data.get("image")
        palette_name = data.get("palette")

        try:
            width = int(data.get("width"))
            height = int(data.get("height"))
            colors = int(data.get("colors"))
        except (TypeError, ValueError):
            return JsonResponse(
                {"error": "Invalid payload: width, height and colors must be numbers"},
                status=400,
            )

        try:
            count_per_cm = float(data.get("count_per_cm", 5.5))
        except (TypeError, ValueError):
            count_per_cm = 5.5

        if count_per_cm <= 0:
            count_per_cm = 5.5

        if not image_base64 or not palette_name:
            return JsonResponse(
                {"error": "Invalid payload: image and palette are required"},
                status=400,
            )

        if width < 1 or height < 1 or colors < 1:
            return JsonResponse(
                {"error": "Invalid payload: width, height and colors must be >= 1"},
                status=400,
            )

        result = generate_pattern(
            image_base64=image_base64,
            width=width,
            height=height,
            colors=colors,
            palette_name=palette_name,
            count_per_cm=count_per_cm,
        )
        return JsonResponse(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def get_palette_max_colors(request):
    palette_name = request.GET.get("palette", "")

    try:
        palette = Palette.objects.get(name__iexact=palette_name)
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

        filename = None
        if data.get("image"):
            format_name, imgstr = data["image"].split(";base64,")
            ext = format_name.split("/")[-1]
            filename = f"{uuid.uuid4()}.{ext}"
            original_dir = os.path.join(settings.MEDIA_ROOT, "original")
            os.makedirs(original_dir, exist_ok=True)
            filepath = os.path.join(original_dir, filename)

            with open(filepath, "wb") as f:
                f.write(base64.b64decode(imgstr))

        cells = data["cells"]
        preview_image = generate_pattern_preview(cells, data["width"], data["height"])
        preview_filename = f"preview_{uuid.uuid4()}.png"
        preview_dir = os.path.join(settings.MEDIA_ROOT, "preview")
        os.makedirs(preview_dir, exist_ok=True)
        preview_filepath = os.path.join(preview_dir, preview_filename)
        preview_image.save(preview_filepath, "PNG")

        pattern_payload = {
            "cells": data.get("cells", []),
            "legend": data.get("legend", []),
            "palette": data.get("palette", "DMC"),
        }

        with transaction.atomic():
            inventory_error = _sync_inventory_for_pattern(
                user=user,
                old_payload={},
                new_payload=pattern_payload,
            )
            if inventory_error:
                return JsonResponse({"error": inventory_error}, status=400)

            pattern = Pattern.objects.create(
                user=user,
                canvas=canvas,
                title=data.get("title", "Без названия"),
                image_original=f"original/{filename}" if filename else "",
                image_preview=f"preview/{preview_filename}",
                pattern_data=json.dumps(pattern_payload),
                size_width=data["width"],
                size_height=data["height"],
                created_at=timezone.now(),
            )

        return JsonResponse({"id": pattern.pattern_id})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


@login_required(login_url="/login/")
def get_pattern_api(request, pattern_id):
    try:
        pattern = Pattern.objects.select_related("user", "canvas").get(pattern_id=pattern_id)
        if not pattern.is_public and pattern.user != request.user:
            return JsonResponse({"error": "Pattern not found"}, status=404)
        try:
            pattern_data = json.loads(pattern.pattern_data or "{}")
        except (TypeError, json.JSONDecodeError):
            pattern_data = {}
        cells = pattern_data.get("cells", [])
        legend = pattern_data.get("legend", []) or []
        palette_name = pattern_data.get("palette", "DMC")

        def with_palette_prefix(code):
            if code is None:
                return ""
            code_text = str(code)
            if "-" in code_text:
                return code_text
            prefix = f"{palette_name}-"
            return f"{prefix}{code_text}"

        legend_response = []
        for item in legend:
            if isinstance(item, dict):
                row = dict(item)
                row["code"] = with_palette_prefix(row.get("code"))
                legend_response.append(row)
            else:
                legend_response.append(item)

        image_url = settings.MEDIA_URL + pattern.image_preview
        canvas = pattern.canvas
        count_per_cm = float(canvas.count_per_cm) if canvas.count_per_cm else 5.5
        real_width_cm = round(pattern.size_width / count_per_cm, 1)
        real_height_cm = round(pattern.size_height / count_per_cm, 1)
        return JsonResponse({
            "cells": cells,
            "legend": legend_response,
            "palette": palette_name,
            "width": pattern.size_width,
            "height": pattern.size_height,
            "image": image_url,
            "canvas_name": canvas.name,
            "count_per_cm": count_per_cm,
            "real_width_cm": real_width_cm,
            "real_height_cm": real_height_cm,
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
        user=request.user,
    )

    old_pattern_payload = json.loads(pattern.pattern_data or "{}")
    new_pattern_payload = {
        "cells": data.get("cells", []),
        "legend": data.get("legend", []),
        "palette": data.get("palette", "DMC"),
    }

    pattern.title = data.get("title", pattern.title)
    pattern.pattern_data = json.dumps(new_pattern_payload)

    canvas_name = data.get("canvas")
    if canvas_name:
        canvas = Canvas.objects.filter(name=canvas_name).first()
        if not canvas:
            return JsonResponse({"error": "Canvas not found"}, status=400)
        pattern.canvas = canvas

    pattern.size_width = max(int(data.get("width", pattern.size_width)), 1)
    pattern.size_height = max(int(data.get("height", pattern.size_height)), 1)

    with transaction.atomic():
        inventory_error = _sync_inventory_for_pattern(
            user=request.user,
            old_payload=old_pattern_payload,
            new_payload=new_pattern_payload,
        )
        if inventory_error:
            return JsonResponse({"error": inventory_error}, status=400)

        pattern.updated_at = timezone.now()
        pattern.save()

    cells = data.get("cells", [])
    if cells:
        preview_image = generate_pattern_preview(cells, pattern.size_width, pattern.size_height)
        preview_filename = f"preview_{uuid.uuid4()}.png"
        preview_dir = os.path.join(settings.MEDIA_ROOT, "preview")
        os.makedirs(preview_dir, exist_ok=True)
        preview_filepath = os.path.join(preview_dir, preview_filename)
        preview_image.save(preview_filepath, "PNG")
        if pattern.image_preview and pattern.image_preview != pattern.image_original:
            old_preview_path = os.path.join(settings.MEDIA_ROOT, pattern.image_preview)
            if os.path.exists(old_preview_path):
                os.remove(old_preview_path)
        pattern.image_preview = f"preview/{preview_filename}"
        pattern.save()

    return JsonResponse({"id": pattern.pattern_id})
