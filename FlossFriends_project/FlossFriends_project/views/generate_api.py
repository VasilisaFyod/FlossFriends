# image_generator.py
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import torch
import json
from django.http import JsonResponse, HttpResponse
from io import BytesIO
import logging
import time
from functools import lru_cache

logger = logging.getLogger(__name__)

# Global variable to cache the pipeline
_pipeline = None
_loading_lock = None

# Конфигурация модели - используем легкую модель
# Варианты легких моделей (от самых легких к более тяжелым):
# 1. "segmind/tiny-sd" - самая легкая (~1.5GB), качество ниже
# 2. "OFA-Sys/small-stable-diffusion-v0" - средняя (~2GB)
# 3. "CompVis/stable-diffusion-v1-4" - стандартная (~4GB)
# 4. "dreamlike-art/dreamlike-diffusion-1.0" - легкая художественная (~2GB)

# Выбираем оптимальную легкую модель
MODEL_ID = "segmind/tiny-sd"  # Самая быстрая и легкая модель
# MODEL_ID = "OFA-Sys/small-stable-diffusion-v0"  # Раскомментировать для лучшего качества


def get_pipeline():
    """Ленивая загрузка легкого пайплайна"""
    global _pipeline, _loading_lock

    if _pipeline is not None:
        return _pipeline

    if _loading_lock is None:
        import threading

        _loading_lock = threading.Lock()

    with _loading_lock:
        if _pipeline is not None:
            return _pipeline

        logger.info("=" * 60)
        logger.info(f"LOADING LIGHTWEIGHT MODEL: {MODEL_ID}")
        logger.info("=" * 60)

        start_time = time.time()

        try:
            # Используем CPU и float32
            torch_dtype = torch.float32
            device = "cpu"

            logger.info(f"Loading lightweight model from {MODEL_ID}...")
            logger.info("This should take 10-20 seconds (much faster than SD 1.5)")

            # Загрузка легкой модели
            _pipeline = StableDiffusionPipeline.from_pretrained(
                MODEL_ID,
                torch_dtype=torch_dtype,
                safety_checker=None,
                requires_safety_checker=False,
                use_safetensors=True,  # Более быстрая загрузка
            )

            # Используем быстрый scheduler (ускоряет генерацию на 30-40%)
            _pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                _pipeline.scheduler.config,
                algorithm_type="dpmsolver++",
                use_karras_sigmas=True,
            )

            _pipeline = _pipeline.to(device)

            # Оптимизации для CPU
            _pipeline.enable_attention_slicing()

            # Дополнительная оптимизация для маленьких моделей
            if hasattr(_pipeline, "enable_vae_slicing"):
                _pipeline.enable_vae_slicing()

            load_time = time.time() - start_time
            logger.info(f"Lightweight pipeline loaded in {load_time:.2f} seconds")

        except Exception as e:
            logger.error(f"Failed to load lightweight model: {str(e)}")
            # Fallback на другую легкую модель если первая не загрузилась
            logger.info("Trying fallback model: OFA-Sys/small-stable-diffusion-v0")
            try:
                _pipeline = StableDiffusionPipeline.from_pretrained(
                    "OFA-Sys/small-stable-diffusion-v0",
                    torch_dtype=torch.float32,
                    safety_checker=None,
                    requires_safety_checker=False,
                )
                _pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                    _pipeline.scheduler.config
                )
                _pipeline = _pipeline.to(device)
                _pipeline.enable_attention_slicing()
                logger.info("Fallback model loaded successfully")
            except Exception as e2:
                logger.error(f"Fallback also failed: {e2}")
                raise

    return _pipeline


@csrf_exempt
@require_http_methods(["POST"])
def generate_image_api(request):
    """Генерация изображения с оптимизациями для легкой модели"""

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    prompt = data.get("prompt")
    if not prompt:
        return JsonResponse({"error": "Prompt is required"}, status=400)

    # Оптимизированные параметры для легкой модели
    negative_prompt = data.get("negative_prompt", "blurry, bad quality, distorted")
    # Легкой модели нужно меньше шагов
    num_inference_steps = min(
        data.get("num_inference_steps", 20), 25
    )  # Максимум 25 шагов
    guidance_scale = data.get("guidance_scale", 7.0)  # Немного ниже для скорости
    seed = data.get("seed", None)

    logger.info(f"Lightweight generation - Prompt: {prompt[:100]}...")
    logger.info(f"Steps: {num_inference_steps} (optimized for lightweight model)")

    try:
        pipe = get_pipeline()

        generator = None
        if seed is not None:
            generator = torch.Generator(device="cpu").manual_seed(seed)

        start_time = time.time()

        # Оптимизация размера изображения для скорости
        with torch.no_grad():
            result = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt if negative_prompt else None,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator,
                width=512,  # Фиксированный размер для скорости
                height=512,
            )
            image = result.images[0]

        generation_time = time.time() - start_time
        logger.info(
            f"Image generated in {generation_time:.2f} seconds (lightweight model)"
        )

        # Сохраняем в bytes с оптимизацией
        buffer = BytesIO()
        image.save(buffer, format="PNG", optimize=True)  # optimize для меньшего размера
        buffer.seek(0)

        return HttpResponse(buffer.getvalue(), content_type="image/png")

    except Exception as e:
        logger.error(f"Error generating image: {str(e)}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def pipeline_status(request):
    """Статус пайплайна"""
    global _pipeline

    if _pipeline is not None:
        return JsonResponse(
            {
                "status": "ready",
                "message": f"Lightweight model {MODEL_ID} is loaded",
                "model": MODEL_ID,
            }
        )
    else:
        return JsonResponse(
            {
                "status": "loading",
                "message": "Lightweight model will load on first request",
                "model": MODEL_ID,
            }
        )
