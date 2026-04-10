from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
import base64
import json
import re
from django.contrib.auth.decorators import login_required 
from PIL import Image 
from io import BytesIO
from django.contrib.auth import update_session_auth_hash, logout
from django.contrib.auth.hashers import make_password
from django.views.decorators.http import require_GET, require_POST
from django.utils import timezone
from ..models import CustomUser, Threadinventory, Thread, Pattern, Category


def _find_thread_by_input(raw_value):
    query = (raw_value or "").strip()
    if not query:
        return None

    palette_match = re.match(r"^\s*([^\s:-]+)\s*[-:]\s*(.+?)\s*$", query)

    if palette_match:
        palette_part, code_part = palette_match.group(1), palette_match.group(2)
        thread = Thread.objects.filter(
            palette__name_palette__iexact=palette_part,
            code__iexact=code_part
        ).first()
        if thread:
            return thread
    else:
        parts = query.split()
        if len(parts) >= 2:
            palette_part = parts[0]
            code_part = "".join(parts[1:])
            thread = Thread.objects.filter(
                palette__name_palette__iexact=palette_part,
                code__iexact=code_part
            ).first()
            if thread:
                return thread

    # Fallback for plain code (when same code exists in multiple palettes, prefer DMC).
    by_code = Thread.objects.filter(code__iexact=query).select_related("palette")
    if not by_code.exists():
        return None
    if by_code.count() == 1:
        return by_code.first()

    preferred = by_code.filter(palette__name_palette__iexact="DMC").first()
    return preferred or by_code.order_by("palette__name_palette", "thread_id").first()


def base(request):
    return render(request, "base.html")

@login_required
def my_profile(request):
    if request.method == "POST":
        user = request.user
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()

        if not username or not email:
            return render(request, "my_profile.html", {"error": "Имя пользователя и email обязательны"})

        # Проверка уникальности
        if CustomUser.objects.exclude(pk=user.pk).filter(username=username).exists():
            return render(request, "my_profile.html", {"error": "Логин уже занят"})
        if CustomUser.objects.exclude(pk=user.pk).filter(email=email).exists():
            return render(request, "my_profile.html", {"error": "Email уже используется"})

        user.username = username
        user.email = email

        if password:
            if len(password) < 8:
                return render(request, "my_profile.html", {"error": "Пароль должен быть минимум 8 символов"})
            user.password = make_password(password)
            update_session_auth_hash(request, user)  # чтобы не выбросило после смены пароля

        user.save()
        return render(request, "my_profile.html", {"message": "Данные успешно обновлены"})

    return render(request, "my_profile.html")

@login_required
def delete_profile_view(request):
    if request.method == "POST":
        user = request.user
        user.delete()  # Удаляем пользователя из базы
        logout(request)  # Выходим из аккаунта
        return redirect("/")  # Можно перенаправить на главную или страницу регистрации
    else:
        return redirect("/profile/")

@login_required
def my_patterns(request):
    patterns = (
        Pattern.objects
        .filter(user=request.user)
        .prefetch_related("categories")
        .order_by("-created_date")
    )
    published_patterns = (
        Pattern.objects
        .filter(user=request.user, is_public=True)
        .prefetch_related("categories")
        .order_by("-updated_date", "-created_date")
    )
    categories = Category.objects.all().order_by("name")
    return render(request, "my_patterns.html", {
        "patterns": patterns,
        "published_patterns": published_patterns,
        "categories": categories
    })
@login_required
def delete_pattern(request, pattern_id):
    if request.method == "POST":
        pattern = Pattern.objects.filter(pattern_id=pattern_id, user=request.user).first()
        if pattern:
            pattern.delete()
    return redirect("my_patterns")


@login_required
@require_POST
def publish_pattern_from_my_patterns(request):
    pattern_id = request.POST.get("pattern_id")
    category_ids = [category_id for category_id in request.POST.getlist("categories") if category_id]
    unique_category_ids = list(dict.fromkeys(category_ids))

    pattern = Pattern.objects.filter(pattern_id=pattern_id, user=request.user).first()
    if not pattern:
        return redirect("my_patterns")

    if not unique_category_ids:
        return redirect("my_patterns")

    max_categories = 3
    if len(unique_category_ids) > max_categories:
        return redirect("my_patterns")

    categories = Category.objects.filter(category_id__in=unique_category_ids)
    if categories.count() != len(unique_category_ids):
        return redirect("my_patterns")

    pattern.is_public = True
    pattern.updated_date = timezone.now()
    pattern.save(update_fields=["is_public", "updated_date"])
    pattern.categories.set(categories)

    return redirect("/my_patterns/?tab=published")


@login_required
@require_POST
def unpublish_pattern(request, pattern_id):
    pattern = Pattern.objects.filter(pattern_id=pattern_id, user=request.user).first()
    if pattern:
        pattern.is_public = False
        pattern.updated_date = timezone.now()
        pattern.save(update_fields=["is_public", "updated_date"])
    return redirect("/my_patterns/?tab=published")

@login_required
def edit_pattern(request, pattern_id):
    pattern = get_object_or_404(Pattern, pattern_id=pattern_id, user=request.user)

    try:
        pattern_payload = json.loads(pattern.pattern_data or "{}")
    except (TypeError, json.JSONDecodeError):
        pattern_payload = {}

    legend = pattern_payload.get("legend", []) or []
    palette = pattern_payload.get("palette", "DMC")

    return render(request, "create_pattern_steps.html", {
        "pattern": pattern,
        "legend": legend,
        "palette": palette
    })




def favorites(request):
    return render(request, "favorites.html")

@login_required
def inventory(request):
    items = Threadinventory.objects.filter(user=request.user).select_related("thread")
    return render(request, "inventory.html", {"items": items})

@login_required
def add_thread(request):
    if request.method == "POST":
        code = request.POST.get("code", "").strip()
        print(f"[DEBUG] POST code: '{code}' from user {request.user}")

        if code:
            thread = _find_thread_by_input(code)
            if thread:
                print(f"[DEBUG] Thread found: {thread.palette.name_palette}-{thread.code}")

                obj, created = Threadinventory.objects.get_or_create(
                    user=request.user,
                    thread=thread,
                    defaults={"skeins_count": 1}
                )
                if created:
                    print("[DEBUG] Thread added to inventory")
                else:
                    print("[DEBUG] Thread already exists in inventory")
            else:
                print(f"[DEBUG] Thread with input '{code}' not found")
        else:
            print("[DEBUG] Empty code")

        return redirect("inventory")




@login_required
def delete_thread(request, thread_id):
    if request.method == "POST":
        Threadinventory.objects.filter(
            user=request.user,
            thread_id=thread_id
        ).delete()

    return redirect("inventory")


@login_required
@require_GET
def get_thread_color(request):
    code = request.GET.get("code", "").strip()
    thread = _find_thread_by_input(code)
    if thread:
        return JsonResponse({"hex": thread.hex_value})
    return JsonResponse({"hex": None})


@login_required
@require_GET
def get_inventory_threads(request):
    items = (
        Threadinventory.objects
        .filter(user=request.user)
        .select_related("thread__palette")
        .order_by("thread__palette__name_palette", "thread__code")
    )

    threads = []
    for item in items:
        thread = item.thread
        palette_name = thread.palette.name_palette
        threads.append({
            "thread_id": thread.thread_id,
            "palette": palette_name,
            "code": thread.code,
            "full_code": f"{palette_name}-{thread.code}",
            "name": thread.name,
            "r": int(thread.rgb_r),
            "g": int(thread.rgb_g),
            "b": int(thread.rgb_b),
        })

    return JsonResponse({"threads": threads})
    
def community(request):
    return render(request, "community.html")

def publish_pattern(request):
    return render(request, "publish_pattern.html")

def first_page(request):
    return render(request, "first_page.html")

def pattern_view(request):
    return render(request, "pattern_view.html")

@login_required(login_url='/login/') 
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

@login_required(login_url='/login/') 
def create_pattern_steps(request): 
    temp_image = request.session.get("temp_image") 
    if not temp_image: 
        return redirect("/add_image_for_create/") 
    return render(request, "create_pattern_steps.html", {"temp_image": temp_image})





