#!/bin/sh
# usage: tools/stills.sh frame [frame...]  -> stills/t<frame>.jpg + contact sheet
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
mkdir -p stills
for f in "$@"; do npx remotion still src/index.ts Main stills/t$f.jpg --frame=$f --image-format=jpeg --browser-executable=$HS >/dev/null 2>stills/err$f.txt || { echo "fail $f"; tail -5 stills/err$f.txt; }; done
python3 -I - "$@" <<'P'
import sys
from PIL import Image
fs=[f'stills/t{a}.jpg' for a in sys.argv[1:]]
W,H=270,480
fs=[f for f in fs if __import__('os').path.exists(f)]
sh=Image.new('RGB',(len(fs)*W,H))
for i,f in enumerate(fs): sh.paste(Image.open(f).resize((W,H)),(i*W,0))
sh.save('stills/contact.jpg')
P
