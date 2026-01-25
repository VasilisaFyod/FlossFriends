import uuid
from django.shortcuts import render, redirect
from django.core.files.storage import FileSystemStorage

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

def first_page(request):
    return render(request, "first_page.html")

def add_image_for_create(request):
    if request.method == 'POST' and request.FILES.get('image'):
        image = request.FILES['image']

        fs = FileSystemStorage(location='media/temp')
        filename = fs.save(f"{uuid.uuid4()}_{image.name}", image)

        # сохраним имя файла в сессии (без БД!)
        request.session['uploaded_image'] = filename

        return redirect('create_pattern_steps')

    return render(request, 'add_image_for_create.html')

def create_pattern_steps(request):
    image_name = request.session.get('uploaded_image')
    if not image_name:
        return redirect('add_image_for_create')
    
    return render(request, 'create_pattern_steps.html', {
        'image_url': f'/media/temp/{image_name}'
    })

