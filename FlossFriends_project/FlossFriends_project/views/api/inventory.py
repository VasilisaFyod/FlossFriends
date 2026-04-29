from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST

from ...models import ThreadInventory
from ...services.inventory_utils import (
    THREAD_SKEIN_LENGTH_CM,
    collect_thread_reservations,
    find_thread_by_input,
    serialize_inventory_thread,
)


@login_required
@require_GET
def get_thread_color(request):
    code = request.GET.get("code", "").strip()
    thread = find_thread_by_input(code)
    if thread:
        return JsonResponse({"hex": thread.hex_value})
    return JsonResponse({"hex": None})


@login_required
@require_POST
def update_thread_quantity(request, thread_id):
    try:
        quantity_cm = int(request.POST.get("quantity_cm", 0))
        if quantity_cm < 0:
            quantity_cm = 0
        ThreadInventory.objects.filter(
            user=request.user,
            thread_id=thread_id,
        ).update(length_cm=quantity_cm)
        return JsonResponse({
            "success": True,
            "length_cm": quantity_cm,
            "skeins": quantity_cm / THREAD_SKEIN_LENGTH_CM,
        })
    except (ValueError, TypeError):
        return JsonResponse({"success": False, "error": "Invalid quantity"}, status=400)


@login_required
@require_GET
def get_inventory_threads(request):
    try:
        current_pattern_id = int(request.GET.get("current_pattern_id", 0) or 0)
    except (TypeError, ValueError):
        current_pattern_id = 0

    reservations = collect_thread_reservations(request.user, current_pattern_id=current_pattern_id)
    items = (
        ThreadInventory.objects
        .filter(user=request.user)
        .select_related("thread__palette")
        .order_by("thread__palette__name", "thread__code")
    )

    threads = [serialize_inventory_thread(item, reservations) for item in items]
    return JsonResponse({"threads": threads})
