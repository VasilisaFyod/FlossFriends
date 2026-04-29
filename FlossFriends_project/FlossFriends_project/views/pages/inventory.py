from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from ...models import ThreadInventory
from ...services.inventory_utils import THREAD_SKEIN_LENGTH_CM, find_thread_by_input


@login_required
def inventory(request):
    items = ThreadInventory.objects.filter(user=request.user).select_related("thread")
    return render(request, "inventory.html", {"items": items})


@login_required
def add_thread(request):
    if request.method == "POST":
        code = request.POST.get("code", "").strip()
        print(f"[DEBUG] POST code: '{code}' from user {request.user}")

        if code:
            thread = find_thread_by_input(code)
            if thread:
                print(f"[DEBUG] Thread found: {thread.palette.name}-{thread.code}")
                _, created = ThreadInventory.objects.get_or_create(
                    user=request.user,
                    thread=thread,
                    defaults={"length_cm": THREAD_SKEIN_LENGTH_CM},
                )
                if created:
                    print("[DEBUG] Thread added to inventory")
                else:
                    print("[DEBUG] Thread already exists in inventory")
            else:
                print(f"[DEBUG] Thread with input '{code}' not found")
        else:
            print("[DEBUG] Empty code")

        return redirect("inventory")


@login_required
def delete_thread(request, thread_id):
    if request.method == "POST":
        ThreadInventory.objects.filter(user=request.user, thread_id=thread_id).delete()
    return redirect("inventory")
