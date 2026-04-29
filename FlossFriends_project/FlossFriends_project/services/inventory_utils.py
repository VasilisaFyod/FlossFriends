import json
import math
import re

from ..models import Pattern, Thread


THREAD_SKEIN_LENGTH_CM = 800


def find_thread_by_input(raw_value):
    query = (raw_value or "").strip()
    if not query:
        return None

    palette_match = re.match(r"^\s*([^\s:-]+)\s*[-:]\s*(.+?)\s*$", query)

    if palette_match:
        palette_part, code_part = palette_match.group(1), palette_match.group(2)
        thread = Thread.objects.filter(
            palette__name__iexact=palette_part,
            code__iexact=code_part,
        ).first()
        if thread:
            return thread
    else:
        parts = query.split()
        if len(parts) >= 2:
            palette_part = parts[0]
            code_part = "".join(parts[1:])
            thread = Thread.objects.filter(
                palette__name__iexact=palette_part,
                code__iexact=code_part,
            ).first()
            if thread:
                return thread

    by_code = Thread.objects.filter(code__iexact=query).select_related("palette")
    if not by_code.exists():
        return None
    if by_code.count() == 1:
        return by_code.first()

    preferred = by_code.filter(palette__name__iexact="DMC").first()
    return preferred or by_code.order_by("palette__name", "thread_id").first()


def normalize_pattern_thread_code(code, palette_name):
    code_text = str(code or "").strip()
    if "-" in code_text:
        palette_part, code_part = code_text.split("-", 1)
        palette_part = palette_part.strip()
        code_part = code_part.strip()
        if palette_part and code_part:
            return palette_part, code_part

    palette_text = str(palette_name or "").strip() or "DMC"
    prefix = f"{palette_text}-"
    if code_text.lower().startswith(prefix.lower()):
        return palette_text, code_text[len(prefix):].strip()
    return palette_text, code_text


def collect_thread_reservations(user, current_pattern_id=None):
    reservations = {}
    patterns = Pattern.objects.filter(user=user).only("pattern_id", "pattern_data")

    for pattern in patterns:
        try:
            payload = json.loads(pattern.pattern_data or "{}")
        except (TypeError, json.JSONDecodeError):
            payload = {}

        palette_name = str(payload.get("palette", "DMC") or "DMC").strip() or "DMC"
        legend = payload.get("legend", []) or []

        for item in legend:
            if not isinstance(item, dict):
                continue

            item_palette_name, code = normalize_pattern_thread_code(item.get("code"), palette_name)
            if not item_palette_name or not code:
                continue

            length_cm = max(float(item.get("length_cm", 0) or 0), 0)
            key = (item_palette_name.lower(), code.lower())

            if key not in reservations:
                reservations[key] = {"current": 0.0, "other": 0.0}

            bucket = "current" if current_pattern_id and pattern.pattern_id == current_pattern_id else "other"
            reservations[key][bucket] += length_cm

    return reservations


def serialize_inventory_thread(item, reservations):
    thread = item.thread
    palette_name = thread.palette.name
    reservation = reservations.get((palette_name.lower(), str(thread.code).strip().lower()), {})
    reserved_by_current_cm = max(float(reservation.get("current", 0) or 0), 0)
    reserved_by_other_patterns_cm = max(float(reservation.get("other", 0) or 0), 0)
    available_length_cm = max(float(item.length_cm) - reserved_by_other_patterns_cm, 0)

    return {
        "thread_id": thread.thread_id,
        "palette": palette_name,
        "code": thread.code,
        "full_code": f"{palette_name}-{thread.code}",
        "name": thread.name,
        "r": int(thread.rgb_r),
        "g": int(thread.rgb_g),
        "b": int(thread.rgb_b),
        "length_cm": item.length_cm,
        "reserved_by_current_cm": int(math.ceil(reserved_by_current_cm)),
        "reserved_by_other_patterns_cm": int(math.ceil(reserved_by_other_patterns_cm)),
        "available_length_cm": int(math.floor(available_length_cm)),
    }
