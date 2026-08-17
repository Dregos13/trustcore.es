#!/usr/bin/env python3
"""Variantes optimizadas de los activos propios (ver build-images.mjs).

Nombres nuevos a propósito: los assets se sirven con
`max-age=31536000, immutable`, así que sobrescribir un fichero deja al
visitante recurrente con la versión pesada en caché durante un año.
"""
import os
from PIL import Image

SITE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site")
A = lambda *p: os.path.join(SITE, "assets", *p)


def kb(path):
    return f"{os.path.getsize(path) / 1024:.0f} KiB"


def save_png(im, path, colors=128):
    """PNG cuantizado: la marca es plana y con 128 colores baja de 134 KiB a 17."""
    im.quantize(colors=colors, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG).save(
        path, "PNG", optimize=True
    )
    print(f"  PNG  {os.path.relpath(path, SITE):55} {im.size[0]}x{im.size[1]:<5} {kb(path)}")


def save_webp(im, path, quality=82):
    im.save(path, "WEBP", quality=quality, method=6)
    print(f"  WEBP {os.path.relpath(path, SITE):55} {im.size[0]}x{im.size[1]:<5} {kb(path)}")


def save_jpg(im, path, quality=80):
    im.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"  JPG  {os.path.relpath(path, SITE):55} {im.size[0]}x{im.size[1]:<5} {kb(path)}")


def fit(im, width):
    if im.width <= width:
        return im.copy()
    h = round(im.height * width / im.width)
    return im.resize((width, h), Image.LANCZOS)


# ---------------------------------------------------------------- marca
# 1590x1738 y 942 KiB para un hueco de 37x40 px en la cabecera. Se sirve
# además como favicon, así que cada visita se descargaba casi 1 MB.
print("Marca TrustCore")
src = Image.open(A("trustcore-icon.png")).convert("RGBA")

# Cabecera (h-10 = 40px) y pie (h-9 = 36px): 120px de alto cubre 3x.
mark = src.copy()
mark.thumbnail((10000, 120), Image.LANCZOS)
save_png(mark, A("trustcore-mark-120.png"))

# Logo para JSON-LD / structured data (Google pide >=112px de lado).
logo = src.copy()
logo.thumbnail((10000, 512), Image.LANCZOS)
save_png(logo, A("trustcore-mark-512.png"))

# Favicons: lienzo cuadrado para que ningún navegador recorte la marca.
side = max(src.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(src, ((side - src.width) // 2, (side - src.height) // 2))
for px, name in ((32, "favicon-32.png"), (180, "favicon-180.png")):
    save_png(square.resize((px, px), Image.LANCZOS), A(name))

# ---------------------------------------------- capturas de producto
# Se muestran como mucho a ~620px en escritorio y ~380px en móvil.
print("Capturas de producto")
for name in ("trustinfacts-dashboard", "trustintime-dashboard", "trustintime-ausencias"):
    shot = Image.open(A(f"{name}.png")).convert("RGB")
    for w in (640, 960, 1280):
        save_webp(fit(shot, w), A(f"{name}-{w}.webp"))

# ----------------------------------------------- pósters de los vídeos
# `<video poster>` no admite fallback, así que se mantiene JPEG.
print("Pósters de vídeo")
posters = sorted(f for f in os.listdir(A("posters")) if f.endswith(".jpg") and "-960" not in f)
for f in posters:
    poster = Image.open(A("posters", f)).convert("RGB")
    save_jpg(fit(poster, 960), A("posters", f.replace(".jpg", "-960.jpg")), quality=78)

# ------------------------------------------------------------ og:image
# Declarada como 1200x630 en los meta, pero el fichero medía 1196x625.
print("Open Graph")
og = Image.open(A("og-image.png")).convert("RGB")
save_jpg(og.resize((1200, 630), Image.LANCZOS), A("og-image-1200x630.jpg"), quality=86)
