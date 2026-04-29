from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_POST

from ...models import Favorite, Like, Pattern


@login_required(login_url="/login/")
@require_POST
def toggle_favorite(request, pattern_id):
    pattern = get_object_or_404(Pattern, pattern_id=pattern_id)
    fav, created = Favorite.objects.get_or_create(
        user=request.user,
        pattern=pattern,
        defaults={"created_at": timezone.now()},
    )
    if not created:
        fav.delete()
        return JsonResponse({"status": "removed"})
    return JsonResponse({"status": "added"})


@login_required(login_url="/login/")
@require_POST
def toggle_like(request, pattern_id):
    pattern = get_object_or_404(Pattern, pattern_id=pattern_id)
    like, created = Like.objects.get_or_create(
        user=request.user,
        pattern=pattern,
        defaults={"created_at": timezone.now()},
    )
    if not created:
        like.delete()
        return JsonResponse({"status": "removed"})
    return JsonResponse({"status": "added"})
