#!/usr/bin/env python3
"""Generate one self-contained portrait PADEL 5IVE venue photo for Home review.
The original venue image is sourced from the checked-in master HTML, preserving
its logo, architecture and court. The floor extension is sampled from the source
photo with a continuous perspective warp rather than a separate CSS layer.
"""
import base64
import io
import re
import sys
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

root=Path(__file__).resolve().parent.parent
html=(root/'public/index.html').read_text()
found=re.search(r'<div class="p541-venue"[^>]*>\s*<img src="data:image/webp;base64,([^"]+)"',html)
if not found: raise SystemExit('Original PADEL 5IVE venue photo not located')
source=Image.open(io.BytesIO(base64.b64decode(found.group(1)))).convert('RGB')
print('SOURCE IMAGE:',source.size,'pixel aspect',round(source.width/source.height,3))
if '--inspect' in sys.argv:sys.exit(0)

# A single baked asset: photo + genuine lower court area sampled with perspective
# from the original. UI wordmark and buttons remain HTML, never baked in.
W,H=1080,2280
scaled_width=round(W*1.49)
scaled_height=round(source.height*scaled_width/source.width)
main=source.resize((scaled_width,scaled_height),Image.Resampling.LANCZOS)
main=main.crop(((scaled_width-W)//2,0,(scaled_width+W)//2,scaled_height))
# Set a measured position for the full photo (signage/net/bleachers) and leave
# the upper area available for the live HTML brand heading.
photo_top=max(185,min(345,int(H*.125)))
end=photo_top+scaled_height
print('COMPOSE: photo top',photo_top,'height',scaled_height,'ends',end,'target',H)
if end>H-210:
    # Never clip the original venue's court without a clear transition.
    photo_top=max(115,H-210-scaled_height)
    end=photo_top+scaled_height
work=Image.new('RGB',(W,H),(5,17,31))
# The photographic upper ceiling is mirrored from the first real frame and
# darkened gently; this keeps the same roof color and avoids a flat brown band.
ceiling_height=min(scaled_height//5,178)
ceiling=main.crop((0,0,W,ceiling_height))
ceiling=ImageOps.flip(ceiling).resize((W,photo_top),Image.Resampling.BICUBIC)
ceiling=ceiling.filter(ImageFilter.GaussianBlur(5))
for y in range(photo_top):
    row=ceiling.crop((0,y,W,y+1))
    t=y/max(1,photo_top-1)
    # The brand sits against deep navy; the lower reflection meets the actual
    # venue at full intensity and the original ceiling row is unchanged.
    shade=.15+.85*(t**1.4)
    row=ImageEnhance.Brightness(row).enhance(shade)
    work.paste(row,(0,y))
# Full crop, exact photographic source pixel lines.
work.paste(main,(0,photo_top))
# Extend the lower blue court using edge-aware panorama projection; no separate
# sharp image/CSS mask. The center stripe is explicitly continued in perspective.
if end<H:
    floor_len=H-end
    # Last court pixels in the real photo are solid playing surface (net and
    # boundary rails sit substantially higher). Do not repeat a tall strip:
    # repeating a court row creates fake horizontal baseline stripes.
    last=main.crop((0,scaled_height-1,W,scaled_height))
    start_y=max(0,scaled_height-40)
    for y in range(floor_len):
        t=y/max(1,floor_len-1)
        # Non-periodic floor continuation samples only the final solid court
        # region, then opens horizontally in a natural near-camera perspective.
        sample_y=round(start_y+(scaled_height-1-start_y)*(1-(1-t)**3))
        row=main.crop((0,sample_y,W,sample_y+1))
        expand=1.0+0.23*(t**1.35)
        newwidth=round(W*expand)
        row=row.resize((newwidth,1),Image.Resampling.BICUBIC)
        x=(newwidth-W)//2
        row=row.crop((x,0,x+W,1))
        # Baked vignette is gradual. A true blue court texture and central line
        # continue beneath the Home actions rather than a flat navy CSS strip.
        shade=1.0-0.29*max(0,t-.20)/.80
        row=ImageEnhance.Brightness(row).enhance(shade)
        if y<42:
            row=Image.blend(last,row,y/42.0)
        work.paste(row,(0,end+y))
# A subtle editorial vignette whose strongest coverage is beneath UI controls;
# it NEVER deletes or abruptly masks the photo.
overlay=Image.new('RGBA',(W,H),(0,0,0,0))
draw=ImageDraw.Draw(overlay)
for y in range(H):
    t=y/max(1,H)
    alpha=round(30+66*max(0,(t-.63)/.37)**1.8)
    draw.line((0,y,W,y),fill=(1,11,24,alpha))
overlay=overlay.filter(ImageFilter.GaussianBlur(32))
work=Image.alpha_composite(work.convert('RGBA'),overlay).convert('RGB')
out=root/'public/phase585/home-venue-portrait.webp'
out.parent.mkdir(exist_ok=True)
work.save(out,'WEBP',quality=89,method=6)
print('GENERATED',out,'bytes',out.stat().st_size,'dimensions',work.size)
