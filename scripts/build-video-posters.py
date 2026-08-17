#!/usr/bin/env python3
"""Pósters y duraciones reales de las lecciones en vídeo de /aprende.

Por qué: las 23 lecciones compartían una única `thumbnailUrl` (el dashboard de
producto) y no declaraban `duration`. Google pide miniatura representativa y
duración por vídeo; sin eso las lecciones no entran en el índice de vídeo.

Los .mp4 fuente viven en `VideosTF/` (no se despliegan; en producción están en
S3 bajo /videos/aprende/). Este script extrae de cada uno un fotograma al 60 %
y su duración, y escribe:

  site/assets/posters/<slug>-960.jpg     miniatura 960px
  scripts/video-meta.json                {slug: {duration, poster, width, height}}

Los pósters elegidos a mano que ya existían se respetan: si hay un
`<slug>.jpg` previo, se reescala en vez de extraer un fotograma nuevo.

Uso: node scripts/build-video-posters.mjs
"""
import json, os, re, subprocess, sys, unicodedata
from PIL import Image
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "VideosTF")
POSTERS = os.path.join(ROOT, "site", "assets", "posters")
META = os.path.join(ROOT, "scripts", "video-meta.json")


def slugify(name):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def probe(path):
    """Duración en segundos leyendo la salida de ffmpeg (no hay ffprobe)."""
    out = subprocess.run([FFMPEG, "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", out)
    if not m:
        raise RuntimeError(f"sin duración: {path}")
    h, mi, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
    return h * 3600 + mi * 60 + s


def iso8601(seconds):
    total = int(round(seconds))
    m, s = divmod(total, 60)
    return f"PT{m}M{s}S" if m else f"PT{s}S"


def grab(path, at, out):
    subprocess.run(
        [FFMPEG, "-y", "-ss", f"{at:.2f}", "-i", path, "-frames:v", "1",
         "-vf", "scale=960:-2", "-q:v", "4", out],
        capture_output=True, check=True,
    )


meta = {}
for fname in sorted(os.listdir(SRC)):
    if not fname.lower().endswith(".mp4"):
        continue
    path = os.path.join(SRC, fname)
    slug = slugify(os.path.splitext(fname)[0])
    dur = probe(path)
    out = os.path.join(POSTERS, f"{slug}-960.jpg")
    chosen = os.path.join(POSTERS, f"{slug}.jpg")

    if os.path.exists(chosen):
        # Póster elegido a mano: se conserva, solo se reescala.
        im = Image.open(chosen).convert("RGB")
        if im.width > 960:
            im = im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS)
        im.save(out, "JPEG", quality=78, optimize=True, progressive=True)
        origen = "manual"
    else:
        grab(path, dur * 0.6, out)
        origen = "fotograma 60%"

    w, h = Image.open(out).size
    meta[slug] = {"duration": iso8601(dur), "seconds": round(dur, 2),
                  "poster": f"/assets/posters/{slug}-960.jpg", "width": w, "height": h}
    print(f"  {slug:38} {iso8601(dur):>8}  {w}x{h}  {os.path.getsize(out)//1024:>3} KiB  ({origen})")

json.dump(meta, open(META, "w"), indent=2, ensure_ascii=False, sort_keys=True)
print(f"\n{len(meta)} lecciones → {os.path.relpath(META, ROOT)}")
