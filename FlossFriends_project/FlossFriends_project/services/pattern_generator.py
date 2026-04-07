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

def get_threads_palette(palette_name):
    palette_name = palette_name.lower()
    if palette_name not in _threads_cache:
        threads = Thread.objects.filter(palette__name_palette__iexact=palette_name)
        if not threads.exists():
            _threads_cache[palette_name] = ([], np.array([]))
        else:
            palette = np.array([[t.rgb_r, t.rgb_g, t.rgb_b] for t in threads])
            _threads_cache[palette_name] = (list(threads), palette)
    return _threads_cache[palette_name]

def select_top_thread_indices(pixels, palette, n_colors):
    if pixels.size == 0 or n_colors <= 0 or palette.size == 0:
        return np.array([], dtype=int)
    distances = np.sum((pixels[:, None, :] - palette[None, :, :]) ** 2, axis=2)
    nearest = np.argmin(distances, axis=1)
    counts = np.bincount(nearest, minlength=palette.shape[0])
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

    threads, palette = get_threads_palette(palette_name)
    n_colors = min(colors, len(threads), len(pixels))

    if n_colors <= 0:
        empty = [[{"r":255,"g":255,"b":255,"code":None} for _ in range(width)] for _ in range(height)]
        return {"cells": empty, "colors_used": 0, "legend": []}

    if len(threads) <= n_colors:
        selected_indices = np.arange(len(threads), dtype=int)
    else:
        selected_indices = select_top_thread_indices(pixels, palette, n_colors)

    selected_threads = [threads[i] for i in selected_indices]
    selected_palette = palette[selected_indices]
    mapped_centers = [find_closest_thread(c, selected_threads, selected_palette) for c in selected_palette]

    cells = []
    counter = Counter()

    for y in range(height):
        row = []
        for x in range(width):
            src_x = int(x * aw / width)
            src_y = int(y * ah / height)

            alpha = img_array[src_y, src_x, 3]

            if alpha < 10:
                row.append({"r":255,"g":255,"b":255,"code":None})
                continue

            color = img_array[src_y, src_x, :3]
            label = int(np.argmin(np.sum((selected_palette - color) ** 2, axis=1)))
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
