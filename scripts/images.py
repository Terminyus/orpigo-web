"""Build web images from assets-src/ into public/img/ (WebP + AVIF).

Android store screenshots carry a marketing banner on top (incl. a claim we
do not repeat on the site), so they are cropped below it here.
"""
import subprocess, sys, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'assets-src', ROOT / 'public' / 'img'
APP = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path.home() / 'Desktop/Orpigo'
OUT.mkdir(parents=True, exist_ok=True)

def emit(img, name, width):
    img = img.convert('RGB') if img.mode not in ('RGB', 'RGBA') else img
    h = round(img.height * width / img.width)
    tmp = OUT / f'{name}.png'
    img.resize((width, h), Image.LANCZOS).save(tmp)
    subprocess.run(['cwebp', '-quiet', '-q', '82', str(tmp), '-o', str(OUT / f'{name}.webp')], check=True)
    subprocess.run(['avifenc', '-q', '60', '-s', '6', str(tmp), str(OUT / f'{name}.avif')], check=True, capture_output=True)
    tmp.unlink()
    print(name, width, h)

# iOS screens (1320x2868)
for p in sorted(SRC.glob('*.png')):
    if p.stem.startswith('logo'):
        continue
    emit(Image.open(p), f'screen-{p.stem}', 440)

# Android reader screens: crop the 0-260px marketing banner, keep phone ratio.
for name in ['02_reader_light', '06_reader_dark', '03_speed', '05_settings']:
    im = Image.open(APP / 'store_assets/android/screenshots' / f'{name}.png')
    top = 280
    im = im.crop((0, top, im.width, im.height))
    emit(im, f'android-{name[3:]}', 440)

# Logo
logo = Image.open(SRC / 'logo-320.png').convert('RGBA')
for s in (64, 192):
    logo.resize((s, s), Image.LANCZOS).save(OUT / f'logo-{s}.png')
logo.resize((32, 32), Image.LANCZOS).save(ROOT / 'public' / 'favicon.png')
Image.open(SRC / 'logo-1024.png').convert('RGB').resize((512, 512), Image.LANCZOS).save(ROOT / 'public' / 'apple-touch-icon.png')
