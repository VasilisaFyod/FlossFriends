import base64
from io import BytesIO

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect, render
from PIL import Image


def first_page(request):
    return render(request, "first_page.html")


@login_required(login_url="/login/")
def add_image_for_create(request):
    if request.method == "POST":
        image = request.FILES.get("image")
        if not image:
            return JsonResponse({"error": "Файл не получен"}, status=400)

        allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/gif"]
        if image.content_type not in allowed_types:
            return JsonResponse({"error": "Неверный тип файла"}, status=400)

        img = Image.open(image)
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        request.session["temp_image"] = base64.b64encode(buffer.getvalue()).decode()
        image_url = "data:image/png;base64," + request.session["temp_image"]
        return JsonResponse({"image_url": image_url})

    return render(request, "add_image_for_create.html")


@login_required(login_url="/login/")
def create_pattern_steps(request):
    temp_image = request.session.get("temp_image")
    if not temp_image:
        return redirect("/add_image_for_create/")
    return render(request, "create_pattern_steps.html", {"temp_image": temp_image})
