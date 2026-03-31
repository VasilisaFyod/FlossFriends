from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from ..services.auth_service import register_user, login_user
from ..models import CustomUser

def register_view(request):
    if request.method == "POST":
        result = register_user(request)

        if result["error"]:
            return render(request, "register.html", {"error": result["error"]})

        return render(request, "check_email.html")

    return render(request, "register.html")

def login_view(request):
    if request.method == "POST":
        result = login_user(request)

        if result["error"]:
            return render(request, "login.html", {"error": result["error"]})

        login(request, result["user"])
        return redirect("/add_image_for_create")

    return render(request, "login.html")

def verify_email(request, token): 
    try: 
        user = CustomUser.objects.get(verification_token=token) 
        user.email_verified = True 
        user.save() 
        login(request, user) 
        return redirect("/add_image_for_create") 
    except CustomUser.DoesNotExist: 
        return render(request, "error.html", {"error": "Неверная ссылка"})
    
def logout_view(request):
    logout(request)
    return redirect("/")
