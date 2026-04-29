import json
from FlossFriends_project.models import Palette, Thread 
import base64
import numpy as np
from PIL import Image
from io import BytesIO
from collections import Counter
import random


_threads_cache = {}
SYMBOLS = [
    "■","□","▲","△","▼","▽","◆","◇","●","○",
    "★","☆","✦","✧","▌","▬","▶","◀","◼","◉",
    "◐","◑","◒","◓","◔","◕","◖","◗","♠","♣",
    "♥","♦","♤","♧","♡","♢","☀","☁","☂","☄",
    "☾","☽","☼","✕","✖","✚","▣","▤","▥","▦",
    "▧","▩","⬟","⬢","→","←","↑","↓","↔","↕",
    "↗","↛","↝","↞","↟","↣","↬","↭","↯","↱",
    "↺","⇈","⇇","↮","↶","↿","↹","⇋","⇍","⇎",
    "⇑","⇐","⇔","⇕","⇚","⇝","⇟","⇣","⇪","⇨",
    "⇯","⇭","✡","✪","✫","✬","✹","✵","✶","✷",
    "✻","❋","☉","+","−","×","÷","=","≠","≈",
    "≡","<","≤","∞","±","√","∑","∏","∫","∬",
    "∮","∇","∂","∆","∵","∪","⊂","⊇","∈","∉",
    "∅","∀","∃","∠","∟","⊥","∝","$","¢","£",
    "¥","₠","₢","₥","₦","₩","¤","₪","₮","₰",
    "₱","₲","₳","₶","Α","Β","Γ","Ζ","Η","Ε",
    "Θ","Μ","Ξ","Υ","Φ","Χ","Ψ","Ω","ν","♩",
    "♪","♫","※","⁂","❆","☊","☺","☍","☘","✿",
    "❀","☏","✄","①","②","③","④","⑤","⑥","⑦",
    "⑧","⑨","ⓐ","ⓑ","ⓒ","ⓓ","ⓔ","ⓕ","ⓖ","ⓗ",
    "ⓘ","ⓙ","ⓚ","ⓛ","ⓜ","ⓝ","ⓞ","ⓟ","ⓠ","ⓡ",
    "ⓢ","ⓣ","ⓤ","ⓥ","ⓦ","ⓧ","ⓨ","ⓩ","⓪","⚐",
    "⚑","⛿","Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ","Ⅵ","Ⅶ",
    "Ⅸ","Ⅹ","Ⅺ","Ⅻ","Ⅼ","a","b","c","d","e",
    "f","g","h","i","j","k","l","m","n","o",
    "p","q","r","s","t","u","v","w","x","y",
    "z","{","|","}","~","µ","Æ","Ð","Þ","ß",
    "℘","ℑ","ℜ","ℵ","Œ","♬","♭","♮","♯",
    "⌦","⌧","⌬","⌼","⌨","⍈","⍍","⍔","⌹",
    "⍠","⌺","⍟","⍫","⍰","⍃","⍁","⍂","⌻","⍋",
    "⛻","⏱"
]

def generate_symbols(n):
    symbols = SYMBOLS.copy()
    if n > len(symbols):
        raise ValueError("Запрошено больше символов, чем доступно уникальных")
    return random.sample(symbols, n)

def build_legend(cells):
    flat = [cell["code"] for row in cells for cell in row]
    counter = Counter(flat)
    return counter

def calculate_length(count, count_per_cm):
    cross_cm = 1 / count_per_cm
    return round(count * cross_cm * 4, 1)

def decode_image(image_base64):
    fmt, imgstr = image_base64.split(';base64,')
    return Image.open(BytesIO(base64.b64decode(imgstr))).convert('RGBA')

def rgb_to_lab_array(rgb_array):
    """Конвертирует массив Nx3 (RGB 0-255) в CIE Lab для перцептуально точного сравнения цветов."""
    rgb = np.asarray(rgb_array, dtype=np.float64) / 255.0
    # sRGB -> линейный RGB (убираем гамму)
    linear = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    # Линейный RGB -> XYZ (при освещении D65)
    M = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041]
    ])
    xyz = linear @ M.T
    # Нормализация по белой точке D65
    xyz[:, 0] /= 0.95047
    xyz[:, 2] /= 1.08883
    # XYZ -> Lab
    def f(t):
        return np.where(t > 0.008856, np.cbrt(t), (903.3 * t + 16.0) / 116.0)
    fx, fy, fz = f(xyz[:, 0]), f(xyz[:, 1]), f(xyz[:, 2])
    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    b = 200.0 * (fy - fz)
    return np.stack([L, a, b], axis=1)

def get_threads_palette(palette_name):
    palette_name = palette_name.lower()
    if palette_name not in _threads_cache:
        threads = Thread.objects.filter(palette__name__iexact=palette_name)
        if not threads.exists():
            _threads_cache[palette_name] = ([], np.empty((0, 3)), np.empty((0, 3)))
        else:
            palette = np.array([[t.rgb_r, t.rgb_g, t.rgb_b] for t in threads])
            palette_lab = rgb_to_lab_array(palette)
            _threads_cache[palette_name] = (list(threads), palette, palette_lab)
    return _threads_cache[palette_name]

def select_top_thread_indices(pixels, palette_lab, n_colors):
    if pixels.size == 0 or n_colors <= 0 or palette_lab.size == 0:
        return np.array([], dtype=int)
    pixels_lab = rgb_to_lab_array(pixels)
    distances = np.sum((pixels_lab[:, None, :] - palette_lab[None, :, :]) ** 2, axis=2)
    nearest = np.argmin(distances, axis=1)
    counts = np.bincount(nearest, minlength=palette_lab.shape[0])
    return np.argsort(counts)[::-1][:n_colors]

def find_closest_thread(color, threads, palette):
    if len(threads) == 0:
        return {"r": 0, "g": 0, "b": 0, "code": "---", "name": "Нет нитей"}
    distances = np.sum((palette - color) ** 2, axis=1)
    idx = int(np.argmin(distances))
    t = threads[idx]
    return {
        "r": int(t.rgb_r),
        "g": int(t.rgb_g),
        "b": int(t.rgb_b),
        "code": t.code,
        "name": t.name
    }

def generate_pattern(image_base64, width, height, colors, palette_name, count_per_cm=5.5):
    if not image_base64:
        raise ValueError("image_base64 пустой")

    image = Image.open(BytesIO(base64.b64decode(image_base64.split(',')[1]))).convert('RGBA')

    max_analysis_size = 50
    scale = min(1.0, max_analysis_size / max(width, height))
    aw = max(1, int(width * scale))
    ah = max(1, int(height * scale))

    image_small = image.resize((aw, ah), Image.LANCZOS)
    img_array = np.array(image_small)

    mask = img_array[:, :, 3] > 10
    pixels = img_array[mask, :3]

    threads, palette, palette_lab = get_threads_palette(palette_name)
    n_colors = min(colors, len(threads), len(pixels))

    if n_colors <= 0:
        empty = [[{"r":255,"g":255,"b":255,"code":None} for _ in range(width)] for _ in range(height)]
        return {"cells": empty, "colors_used": 0, "legend": []}

    if len(threads) <= n_colors:
        selected_indices = np.arange(len(threads), dtype=int)
    else:
        selected_indices = select_top_thread_indices(pixels, palette_lab, n_colors)

    selected_threads = [threads[i] for i in selected_indices]
    selected_palette = palette[selected_indices]
    selected_palette_lab = palette_lab[selected_indices]
    mapped_centers = [
        {"r": int(t.rgb_r), "g": int(t.rgb_g), "b": int(t.rgb_b), "code": t.code, "name": t.name}
        for t in selected_threads
    ]

    cells = []
    counter = Counter()

    img_lab = rgb_to_lab_array(img_array[:, :, :3].reshape(-1, 3)).reshape(ah, aw, 3)

    for y in range(height):
        row = []
        for x in range(width):
            src_x = int(x * aw / width)
            src_y = int(y * ah / height)

            alpha = img_array[src_y, src_x, 3]

            if alpha < 10:
                row.append({"r":255,"g":255,"b":255,"code":None})
                continue

            color_lab = img_lab[src_y, src_x]
            label = int(np.argmin(np.sum((selected_palette_lab - color_lab) ** 2, axis=1)))
            thread = mapped_centers[label]

            row.append(thread)
            counter[thread["code"]] += 1

        cells.append(row)

    sorted_items = counter.most_common()  
    symbols = generate_symbols(len(sorted_items))

    threads_dict = {t.code: t for t in threads}
    legend = []

    for i, (code, count) in enumerate(sorted_items):
        t = threads_dict.get(code)

        legend.append({
            "code": code,
            "name": t.name if t else "",
            "r": int(t.rgb_r) if t else 0,
            "g": int(t.rgb_g) if t else 0,
            "b": int(t.rgb_b) if t else 0,
            "symbol": symbols[i],
            "count": count,
            "length_cm": calculate_length(count, count_per_cm)
        })

    return {
        "cells": cells,
        "colors_used": len(counter),
        "legend": legend
    }
