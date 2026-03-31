from django.contrib.auth import authenticate
import uuid
import re
from django.core.mail import send_mail
from django.conf import settings
from ..models import CustomUser
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


def register_user(request):
    username = request.POST.get("username", "").strip()
    email = request.POST.get("email", "").strip()
    password = request.POST.get("password", "").strip()

    # Проверка на пустые поля
    if not username or not email or not password:
        return {"error": "Заполните все поля"}

    # Валидация username (только буквы, цифры и _)
    if not re.match(r'^\w{3,30}$', username):
        return {"error": "Логин должен быть 3-30 символов, только буквы, цифры и _"}

    # Проверка email
    try:
        validate_email(email)
    except ValidationError:
        return {"error": "Введите корректный Email"}

    # Проверка пароля (мин. 8 символов, хотя бы одна буква и цифра)
    if len(password) < 8 or not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password):
        return {"error": "Пароль должен быть минимум 8 символов и содержать буквы и цифры"}

    # Проверка на существующие username/email
    if CustomUser.objects.filter(username=username).exists():
        return {"error": "Логин уже занят"}

    if CustomUser.objects.filter(email=email).exists():
        return {"error": "Email уже используется"}

    # Создаем пользователя
    user = CustomUser(username=username, email=email)
    user.set_password(password)
    user.verification_token = uuid.uuid4()

    # Генерация ссылки для подтверждения email
    link = f"http://127.0.0.1:8000/verify-email/{user.verification_token}/"

    try:
        user.save()

        # Отправка письма
        send_mail(
            "Подтверждение регистрации",
            f"Перейдите по ссылке для подтверждения: {link}",
            settings.EMAIL_HOST_USER,
            [user.email],
        )

    except Exception as e:
        user.delete()
        return {"error": f"Ошибка при регистрации: {str(e)}"}

    return {"error": None}


def login_user(request):
    username = request.POST.get("username", "").strip()
    password = request.POST.get("password", "").strip()

    # Проверка на пустые поля
    if not username or not password:
        return {"error": "Заполните все поля", "user": None}

    # Проверяем существует ли пользователь
    try:
        user_obj = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return {"error": "Пользователь не найден", "user": None}

    # Аутентификация
    user = authenticate(request, username=username, password=password)
    if not user:
        return {"error": "Неверный пароль", "user": None}

    # Проверка подтверждения email
    if not user.email_verified:
        return {"error": "Подтвердите email", "user": None}

    return {"error": None, "user": user}
