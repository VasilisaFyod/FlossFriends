from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
import base64
from django.contrib.auth.decorators import login_required 
from PIL import Image 
from io import BytesIO
from django.contrib.auth import update_session_auth_hash, logout
from django.contrib.auth.hashers import make_password
from django.views.decorators.http import require_GET
from ..models import CustomUser, Threadinventory, Thread, Threadinventory,Pattern,Threadcalculation


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
    patterns = Pattern.objects.filter(user=request.user)
    return render(request, "my_patterns.html", {"patterns": patterns})
@login_required
def delete_pattern(request, pattern_id):
    if request.method == "POST":
        Pattern.objects.filter(pattern_id=pattern_id, user=request.user).delete()
    return redirect("my_patterns")

@login_required
def edit_pattern(request, pattern_id):
    pattern = get_object_or_404(Pattern, pattern_id=pattern_id, user=request.user)

    thread_calcs = Threadcalculation.objects.filter(pattern=pattern).select_related("thread")

    legend = [
        {
            "code": tc.thread.code,
            "symbol": tc.symbol,
            "length_cm": float(tc.length_cm),
            "r": tc.thread.rgb_r,
            "g": tc.thread.rgb_g,
            "b": tc.thread.rgb_b,
        }
        for tc in thread_calcs
    ]
    palette = thread_calcs.first().thread.palette.name_palette if thread_calcs.exists() else "DMC"

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
        print(f"[DEBUG] POST code: '{code}' от пользователя {request.user}")  # вывод в консоль сервера

        if code:
            try:
                thread = Thread.objects.get(code__iexact=code)
                print(f"[DEBUG] Найдена нитка: {thread.code}, {thread.palette.name_palette}")

                obj, created = Threadinventory.objects.get_or_create(
                    user=request.user,
                    thread=thread,
                    defaults={"skeins_count": 1}
                )
                if created:
                    print(f"[DEBUG] Нитка добавлена в инвентарь")
                else:
                    print(f"[DEBUG] Нитка уже есть в инвентаре")

            except Thread.DoesNotExist:
                print(f"[DEBUG] Нитка с кодом '{code}' не найдена")

        else:
            print("[DEBUG] Код пустой")

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
    try:
        thread = Thread.objects.get(code__iexact=code)
        return JsonResponse({"hex": thread.hex_value})
    except Thread.DoesNotExist:
        return JsonResponse({"hex": None})
    
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