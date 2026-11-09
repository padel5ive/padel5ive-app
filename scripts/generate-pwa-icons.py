#!/usr/bin/env python3
"""Generate PADEL 5IVE PWA icons from canonical master logo."""
from pathlib import Path
from PIL import Image
import argparse

root=Path(__file__).resolve().parent.parent
logo=Image.open(root/'public/assets/p5-master-logo-original.png').convert('RGBA')
dest=root/'public/pwa/icons'
dest.mkdir(parents=True,exist_ok=True)
for size,name,scale in [
 (180,'apple-touch-icon.png',.76),
 (192,'icon-192.png',.76),
 (512,'icon-512.png',.76),
 (512,'icon-maskable-512.png',.64),
]:
    icon=Image.new('RGBA',(size,size),(9,22,36,255))
    h=round(size*scale)
    w=round(logo.width*h/logo.height)
    art=logo.resize((w,h),Image.Resampling.LANCZOS)
    icon.alpha_composite(art,((size-w)//2,(size-h)//2))
    icon.convert('RGB').save(dest/name,format='PNG',optimize=True)
    print(name,(dest/name).stat().st_size)
