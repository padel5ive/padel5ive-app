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
# Extend dark ceiling upward naturally by smoothly blending the first existing
# rows with venue-specific ambient colors. No hard horizontal seam.
ceiling_color=source.getpixel((source.width//2,max(0,int(source.height*.055))))
for y in range(photo_top):
    t=y/max(1,photo_top)
    dark=(4,14,27)
    p=tuple(int(dark[i]*(1-t)+ceiling_color[i]*t*.53) for i in range(3))
    ImageDraw.Draw(work).line((0,y,W,y),fill=p)
# Full crop, exact photographic source pixel lines.
work.paste(main,(0,photo_top))
# Extend the lower blue court using edge-aware panorama projection; no separate
# sharp image/CSS mask. The center stripe is explicitly continued in perspective.
if end<H:
    floor_len=H-end
    # Work off the lowest 18% of the SOURCE-CROPPED photo, which should depict
    # only playing surface. Source colour is retained by the repeats.
    band_height=max(28,min(180,round(scaled_height*.19)))
    floor=main.crop((0,scaled_height-band_height,W,scaled_height))
    # Cross-dissolve the texture's repeat cycle to prevent a repeated-row seam.
    for y in range(floor_len):
        t=y/max(1,floor_len-1)
        a=(y/(1.5+0.3*t))%band_height
        sample=floor.crop((0,int(a),W,int(a)+1)).resize((W,1))
        # Perspective scale increases toward the near baseline.
        scale=1.0+0.17*t
        row=sample.resize((int(W*scale),1),Image.Resampling.BICUBIC)
        x=(row.width-W)//2
        row=row.crop((x,0,x+W,1))
        # Subtle photographic darkening below CTA, never solid flat navy.
        shade=1.0-0.30*max(0,t-.13)/.87
        if shade!=1:row=ImageEnhance.Brightness(row).enhance(shade)
        work.paste(row,(0,end+y))
    # Full-width lower gradient is baked INTO the photo with soft transitions;
    # preserve the central court stripe, court texture and perspective.
    # Smooth first floor rows where the original photograph meets extrapolated floor.
    feather=min(115,floor_len)
    for y in range(feather):
        t=y/max(1,feather)
        a=work.crop((0,end+y,W,end+y+1))
        original_edge=main.crop((0,scaled_height-1,W,scaled_height))
        Image.Image.paste(work,Image.blend(original_edge,a,min(1,t**0.8)),(0,end+y))
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
