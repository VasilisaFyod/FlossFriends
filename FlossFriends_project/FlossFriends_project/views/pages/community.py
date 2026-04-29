import json

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from ...models import Canvas, Category, Favorite, Like, Pattern


@login_required(login_url="/login/")
def favorites(request):
    favs = (
        Favorite.objects.filter(user=request.user)
        .select_related("pattern__user")
        .prefetch_related("pattern__categories")
        .order_by("-created_at")
    )
    patterns_data = [
        {
            "id": favorite.pattern.pattern_id,
            "title": favorite.pattern.title,
            "preview": favorite.pattern.image_preview,
            "categories": [category.name for category in favorite.pattern.categories.all()],
        }
        for favorite in favs
    ]
    return render(
        request,
        "favorites.html",
        {
            "patterns": patterns_data,
            "MEDIA_URL": settings.MEDIA_URL,
        },
    )


@login_required(login_url="/login/")
def community(request):
    patterns = (
        Pattern.objects.filter(is_public=True)
        .exclude(user=request.user)
        .select_related("user")
        .prefetch_related("categories")
        .order_by("-created_at")
    )
    favorite_ids = set(Favorite.objects.filter(user=request.user).values_list("pattern_id", flat=True))
    liked_ids = set(Like.objects.filter(user=request.user).values_list("pattern_id", flat=True))

    patterns_data = []
    for pattern in patterns:
        max_dim = max(pattern.size_width, pattern.size_height)
        if max_dim <= 50:
            size_category = "small"
        elif max_dim <= 150:
            size_category = "medium"
        else:
            size_category = "large"

        pattern_payload = json.loads(pattern.pattern_data or "{}")
        legend_count = len(pattern_payload.get("legend", []) or [])
        if legend_count <= 20:
            colors_category = "few"
        elif legend_count <= 100:
            colors_category = "medium"
        else:
            colors_category = "many"

        patterns_data.append(
            {
                "id": pattern.pattern_id,
                "title": pattern.title,
                "preview": pattern.image_preview,
                "categories": [category.name for category in pattern.categories.all()],
                "is_favorite": pattern.pattern_id in favorite_ids,
                "is_liked": pattern.pattern_id in liked_ids,
                "canvas": pattern.canvas.name if pattern.canvas else "—",
                "size_category": size_category,
                "colors_category": colors_category,
            }
        )

    return render(
        request,
        "community.html",
        {
            "patterns": patterns_data,
            "canvases": Canvas.objects.all(),
            "categories": Category.objects.all(),
            "MEDIA_URL": settings.MEDIA_URL,
        },
    )


@login_required(login_url="/login/")
def publish_pattern(request):
    pattern_id = request.GET.get("id")
    source = request.GET.get("from")
    tab = request.GET.get("tab")
    try:
        pattern_id = int(pattern_id)
    except (TypeError, ValueError):
        return redirect("/community/")

    pattern = get_object_or_404(Pattern, pattern_id=pattern_id, is_public=True)
    is_favorite = Favorite.objects.filter(user=request.user, pattern=pattern).exists()
    is_liked = Like.objects.filter(user=request.user, pattern=pattern).exists()
    likes_count = Like.objects.filter(pattern=pattern).count()
    favorites_count = Favorite.objects.filter(pattern=pattern).count()

    if source == "community":
        back_url = "/community/"
        back_label = "Назад в ленту"
    elif source == "favorites":
        back_url = "/favorites/"
        back_label = "Назад в избранное"
    elif source == "my_patterns" or pattern.user_id == request.user.id:
        back_url = "/my_patterns/"
        if tab in ("my-patterns", "published"):
            back_url = f"/my_patterns/?tab={tab}"
        back_label = "Назад к моим схемам"
    else:
        back_url = "/community/"
        back_label = "Назад в ленту"

    try:
        pattern_payload = json.loads(pattern.pattern_data or "{}")
        legend_count = len(pattern_payload.get("legend", []) or [])
    except Exception:
        legend_count = 0

    return render(
        request,
        "publish_pattern.html",
        {
            "pattern": pattern,
            "is_favorite": is_favorite,
            "is_liked": is_liked,
            "likes_count": likes_count,
            "favorites_count": favorites_count,
            "colors_count": legend_count,
            "back_url": back_url,
            "back_label": back_label,
            "MEDIA_URL": settings.MEDIA_URL,
        },
    )


@login_required(login_url="/login/")
def pattern_view(request):
    pattern_id = request.GET.get("id")
    try:
        pattern_id = int(pattern_id)
    except (TypeError, ValueError):
        return redirect("/my_patterns/")

    pattern = get_object_or_404(Pattern.objects.select_related("user"), pattern_id=pattern_id)
    if not pattern.is_public and pattern.user_id != request.user.id:
        return redirect("/community/")

    source = request.GET.get("from")
    tab = request.GET.get("tab")

    if source == "favorites":
        back_url = "/favorites/"
        back_label = "Назад в избранное"
    elif source == "my_patterns" or pattern.user_id == request.user.id:
        back_url = "/my_patterns/"
        if tab in ("my-patterns", "published"):
            back_url = f"/my_patterns/?tab={tab}"
        back_label = "Назад к моим схемам"
    else:
        back_url = f"/publish_pattern/?id={pattern.pattern_id}"
        back_label = "Назад к публикации"

    canvases = Canvas.objects.all().order_by("count_per_cm")
    return render(
        request,
        "pattern_view.html",
        {
            "pattern": pattern,
            "back_url": back_url,
            "back_label": back_label,
            "canvases": canvases,
        },
    )
