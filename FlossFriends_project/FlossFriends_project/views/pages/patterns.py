import json

from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from ...models import Category, Pattern


@login_required
def my_patterns(request):
    patterns = (
        Pattern.objects.filter(user=request.user).prefetch_related("categories").order_by("-created_at")
    )
    published_patterns = (
        Pattern.objects.filter(user=request.user, is_public=True)
        .prefetch_related("categories")
        .order_by("-updated_at", "-created_at")
    )
    categories = Category.objects.all().order_by("name")
    return render(
        request,
        "my_patterns.html",
        {
            "patterns": patterns,
            "published_patterns": published_patterns,
            "categories": categories,
        },
    )


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
    if not pattern or not unique_category_ids:
        return redirect("my_patterns")

    max_categories = 3
    if len(unique_category_ids) > max_categories:
        return redirect("my_patterns")

    categories = Category.objects.filter(category_id__in=unique_category_ids)
    if categories.count() != len(unique_category_ids):
        return redirect("my_patterns")

    pattern.is_public = True
    pattern.updated_at = timezone.now()
    pattern.save(update_fields=["is_public", "updated_at"])
    pattern.categories.set(categories)
    return redirect("/my_patterns/?tab=published")


@login_required
@require_POST
def unpublish_pattern(request, pattern_id):
    pattern = Pattern.objects.filter(pattern_id=pattern_id, user=request.user).first()
    if pattern:
        pattern.is_public = False
        pattern.updated_at = timezone.now()
        pattern.save(update_fields=["is_public", "updated_at"])
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

    return render(
        request,
        "create_pattern_steps.html",
        {
            "pattern": pattern,
            "legend": legend,
            "palette": palette,
        },
    )
