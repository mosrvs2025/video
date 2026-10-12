#!/usr/bin/env python3
"""Show what a viewer actually sees: overlay a mock Shorts/Reels UI + the safe-zone contract on frames.
  platform_mock.py <video.mp4|frame.png> <out.png> [t1 t2 ...]     (times in s, for video input)
Red tint = measured YouTube Shorts UI (from a real screenshot); amber outline = the stricter contract (engine/layout.json).
Look at the result BEFORE delivering: every lyric word and every face must be clear of the red areas."""
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
src, out, *ts = sys.argv[1:]; root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LY = json.load(open(f"{root}/engine/layout.json")); M = LY["measured"]; C = LY["contract"]["caption"]
frames = []
if src.lower().endswith(".png"): frames = [Image.open(src).convert("RGB")]
else:
    for t in (ts or ["10"]):
        p = tempfile.mktemp(suffix=".png"); subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", src, "-frames:v", "1", p], check=True); frames.append(Image.open(p).convert("RGB"))
def mock(im):
    im = im.resize((540, 960)); W, H = im.size; ov = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    red = (255, 40, 60, 105)
    d.rectangle([0, 0, W, M["topChipsBottom"] * H], fill=red)                                   # Subscriptions / Live chips
    d.rectangle([M["rightRail"]["xFrom"] * W, M["rightRail"]["yFrom"] * H, W, M["bottomUiFrom"] * H], fill=red)   # like/comment/save/share/remix
    d.rectangle([0, M["bottomUiFrom"] * H, W, H], fill=red)                                       # promote / channel / description / public
    d.rectangle([0, 0.79 * H - 4, W * .87, 0.79 * H + 40], fill=(255, 40, 60, 40))
    d.rounded_rectangle([C["left"] * W, C["top"] * H, C["right"] * W, C["bottom"] * H], radius=6, outline=(255, 190, 40, 255), width=3)   # contract
    f = ImageFont.load_default(); d.text((8, M["bottomUiFrom"] * H + 6), "channel / title / description / buttons", fill=(255, 255, 255, 230), font=f)
    d.text((W * .66, 0.58 * H), "like\ncomment\nsave\nshare", fill=(255, 255, 255, 230), font=f)
    d.text((C["left"] * W + 4, C["top"] * H + 4), "SAFE: all lyrics + faces in here", fill=(255, 190, 40, 255), font=f)
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
tiles = [mock(f) for f in frames]; sheet = Image.new("RGB", (540 * len(tiles), 960)); [sheet.paste(t, (540 * i, 0)) for i, t in enumerate(tiles)]; sheet.save(out); print("wrote", out)
