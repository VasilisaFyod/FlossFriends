from django.contrib.auth import logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from django.shortcuts import redirect, render

from ...models import CustomUser


def base(request):
    return render(request, "base.html")


@login_required
def my_profile(request):
    if request.method == "POST":
        user = request.user
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()
        profile_context = {"form_password": password}

        if not username or not email:
            return render(request, "my_profile.html", {"error": "Имя пользователя и email обязательны", **profile_context})

        if CustomUser.objects.exclude(pk=user.pk).filter(username=username).exists():
            return render(request, "my_profile.html", {"error": "Логин уже занят", **profile_context})
        if CustomUser.objects.exclude(pk=user.pk).filter(email=email).exists():
            return render(request, "my_profile.html", {"error": "Email уже используется", **profile_context})

        user.username = username
        user.email = email

        if password:
            if len(password) < 8:
                return render(request, "my_profile.html", {"error": "Пароль должен быть минимум 8 символов", **profile_context})
            user.password = make_password(password)
            update_session_auth_hash(request, user)

        user.save()
        return render(request, "my_profile.html", {"message": "Данные успешно обновлены", **profile_context})

    return render(request, "my_profile.html")


@login_required
def delete_profile_view(request):
    if request.method == "POST":
        user = request.user
        user.delete()
        logout(request)
        return redirect("/")
    return redirect("/profile/")
