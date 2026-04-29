import base64
import json
import os
import re
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from dotenv import load_dotenv


load_dotenv(getattr(settings, "BASE_DIR", None).parent / ".env")


def _extract_pollinations_error_message(payload):
    if isinstance(payload, dict):
        for key in ("error", "message", "detail"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    if isinstance(payload, str) and payload.strip():
        return payload.strip()
    return ""


def _get_pollinations_api_key():
    return (os.getenv("POLLINATIONS_API_KEY") or "").strip()


def _fetch_pollinations_key_info(api_key):
    if not api_key:
        return {}

    url = "https://auth.pollinations.ai/api/keys/me"
    req = urllib_request.Request(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "User-Agent": "FlossFriends/1.0",
        },
    )
    try:
        with urllib_request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8", errors="replace")
        return json.loads(raw or "{}")
    except Exception:
        return {}


def _extract_allowed_models_from_key_info(key_info):
    if not isinstance(key_info, dict):
        return []

    candidates = []
    for key in ("allowedModels", "models", "availableModels"):
        value = key_info.get(key)
        if isinstance(value, list):
            candidates.extend(value)

    normalized = []
    for item in candidates:
        if isinstance(item, str) and item.strip():
            normalized.append(item.strip())
        elif isinstance(item, dict):
            name = item.get("name") or item.get("id") or item.get("model")
            if isinstance(name, str) and name.strip():
                normalized.append(name.strip())
    return _dedupe_preserve_order(normalized)


def _dedupe_preserve_order(items):
    result = []
    seen = set()
    for item in items:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def _resolve_pollinations_model_alias(model_name, allowed_models=None):
    requested = (model_name or "flux").strip()
    allowed = allowed_models or []
    if not allowed:
        return requested

    requested_lower = requested.lower()
    aliases = {
        "flux": ["flux", "flux-dev", "flux-schnell"],
        "flux-dev": ["flux-dev", "flux", "flux-schnell"],
        "flux-schnell": ["flux-schnell", "flux", "flux-dev"],
    }
    candidates = aliases.get(requested_lower, [requested])

    for candidate in candidates:
        for allowed_model in allowed:
            if allowed_model.lower() == candidate.lower():
                return allowed_model

    return allowed[0]


def _prompt_contains_cyrillic(prompt):
    return bool(re.search(r"[А-Яа-яЁё]", prompt or ""))


def _translate_prompt_to_english(prompt):
    prompt_text = (prompt or "").strip()
    if not prompt_text or not _prompt_contains_cyrillic(prompt_text):
        return prompt_text

    url = "https://api.mymemory.translated.net/get?" + urllib_parse.urlencode(
        {
            "langpair": "ru|en",
            "q": prompt_text,
        }
    )
    req = urllib_request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "FlossFriends/1.0",
        },
    )
    try:
        with urllib_request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8", errors="replace")
        payload = json.loads(raw or "{}")
        translated = (
            payload.get("responseData", {}).get("translatedText", "").strip()
            if isinstance(payload, dict)
            else ""
        )
        if translated:
            print(f"[AI] Prompt translated: {prompt_text!r} -> {translated!r}")
            return translated
    except Exception as exc:
        print(f"[AI] Prompt translation failed: {exc}")
    return prompt_text


def _looks_like_model_not_found_error(message):
    text = (message or "").lower()
    return "model" in text and any(
        token in text
        for token in ("not found", "unknown", "invalid", "unsupported", "does not exist")
    )


def _build_pollinations_image_url(base_url, prompt, model):
    base = (base_url or "https://image.pollinations.ai").rstrip("/")
    encoded_prompt = urllib_parse.quote(prompt or "", safe="")
    joiner = "&" if "?" in base else "?"
    if "image.pollinations.ai" in base:
        return f"{base}/prompt/{encoded_prompt}{joiner}model={urllib_parse.quote(model, safe='')}"
    return f"{base}/image/{encoded_prompt}{joiner}model={urllib_parse.quote(model, safe='')}"


def _try_pollinations_image_get(url, api_key):
    req = urllib_request.Request(
        url,
        headers={
            "Accept": "image/*,application/json",
            "User-Agent": "FlossFriends/1.0",
            **({"Authorization": f"Bearer {api_key}"} if api_key else {}),
        },
    )
    with urllib_request.urlopen(req, timeout=60) as response:
        content_type = response.headers.get("Content-Type", "")
        body = response.read()
    return content_type, body


def _generate_pollinations_image(prompt):
    translated_prompt = _translate_prompt_to_english(prompt)
    api_key = _get_pollinations_api_key()
    base_url = (os.getenv("POLLINATIONS_BASE_URL") or "https://image.pollinations.ai").strip()
    requested_model = (os.getenv("POLLINATIONS_IMAGE_MODEL") or "flux").strip()

    key_info = _fetch_pollinations_key_info(api_key)
    allowed_models = _extract_allowed_models_from_key_info(key_info)
    resolved_model = _resolve_pollinations_model_alias(requested_model, allowed_models)

    url = _build_pollinations_image_url(base_url, translated_prompt, resolved_model)
    try:
        content_type, body = _try_pollinations_image_get(url, api_key)
    except urllib_error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw or "{}")
        except json.JSONDecodeError:
            payload = raw
        message = _extract_pollinations_error_message(payload) or f"HTTP {exc.code}"
        if _looks_like_model_not_found_error(message) and resolved_model != "flux":
            fallback_url = _build_pollinations_image_url(base_url, translated_prompt, "flux")
            content_type, body = _try_pollinations_image_get(fallback_url, api_key)
            resolved_model = "flux"
        else:
            raise RuntimeError(message) from exc
    except urllib_error.URLError as exc:
        raise RuntimeError(f"Не удалось подключиться к сервису генерации: {exc.reason}") from exc

    if "application/json" in (content_type or "").lower():
        payload = json.loads(body.decode("utf-8", errors="replace") or "{}")
        message = _extract_pollinations_error_message(payload) or "Сервис генерации не вернул изображение"
        raise RuntimeError(message)

    return {
        "bytes": body,
        "content_type": content_type,
        "translated_prompt": translated_prompt,
        "model": resolved_model,
    }


@csrf_exempt
@login_required(login_url="/login/")
@require_POST
def generate_ai_image(request):
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Некорректный JSON"}, status=400)

    prompt = str(data.get("prompt", "")).strip()
    if not prompt:
        return JsonResponse({"error": "Введите описание изображения"}, status=400)

    try:
        generated = _generate_pollinations_image(prompt)
    except RuntimeError as exc:
        return JsonResponse({"error": str(exc)}, status=502)
    except Exception as exc:
        return JsonResponse({"error": f"Ошибка генерации изображения: {exc}"}, status=500)

    encoded = base64.b64encode(generated["bytes"]).decode("ascii")
    image_content_type = (generated.get("content_type") or "image/png").split(";")[0].strip() or "image/png"
    request.session["temp_image"] = encoded
    return JsonResponse(
        {
            "image_url": f"data:{image_content_type};base64,{encoded}",
            "translated_prompt": generated["translated_prompt"],
            "model": generated["model"],
        }
    )


@csrf_exempt
@login_required(login_url="/login/")
@require_POST
def clear_temp_image(request):
    request.session.pop("temp_image", None)
    request.session.modified = True
    return JsonResponse({"ok": True})


__all__ = ["generate_ai_image", "clear_temp_image"]
