from datetime import timedelta

from django.contrib.auth import login, logout
from django.shortcuts import redirect, render
from django.utils import timezone

from ..models import CustomUser
from ..services.auth_service import login_user, register_user


def register_view(request):
    if request.method == "POST":
        result = register_user(request)

        if result["error"]:
            return render(request, "auth/register.html", {"error": result["error"]})

        return render(request, "auth/check_email.html")

    return render(request, "auth/register.html")


def login_view(request):
    if request.method == "POST":
        result = login_user(request)

        if result["error"]:
            return render(request, "auth/login.html", {"error": result["error"]})

        login(request, result["user"])
        return redirect("/add_image_for_create")

    return render(request, "auth/login.html")


def verify_email(request, token):
    try:
        user = CustomUser.objects.get(verification_token=token)

        if user.token_created_at and timezone.now() > user.token_created_at + timedelta(minutes=5):
            user.verification_token = None
            user.token_created_at = None
            user.save()
            return render(
                request,
                "auth/error.html",
                {"error": "Ссылка для подтверждения истекла. Пожалуйста, зарегистрируйтесь заново."},
            )

        user.email_verified = True
        user.verification_token = None
        user.token_created_at = None
        user.save()
        login(request, user)
        return redirect("/add_image_for_create")
    except CustomUser.DoesNotExist:
        return render(request, "auth/error.html", {"error": "Неверная ссылка"})


def logout_view(request):
    logout(request)
    return redirect("/")
