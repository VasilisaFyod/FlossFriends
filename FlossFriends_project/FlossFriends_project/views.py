from django.shortcuts import render

def base(request):
    return render(request, "base.html")

def my_profile(request):
    return render(request, "my_profile.html")

def my_patterns(request):
    return render(request, "my_patterns.html")

def favorites(request):
    return render(request, "favorites.html")

def inventory(request):
    return render(request, "inventory.html")

def community(request):
    return render(request, "community.html")

def publish_pattern(request):
    return render(request, "publish_pattern.html")

def add_image_for_create(request):
    return render(request, "add_image_for_create.html")

def create_pattern_steps(request):
    return render(request, "create_pattern_steps.html")

def first_page(request):
    return render(request, "first_page.html")