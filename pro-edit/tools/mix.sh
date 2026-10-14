#!/bin/sh
# usage: tools/mix.sh silent.mp4 out.mp4 -- cut audio (leveled) + sfx ducked under it
ffmpeg -v error -y -i "$1" -i audio/combined.wav -i audio/sfx.wav -filter_complex \
"[1:a]asplit[o][sc];[2:a]volume=0.6[s];[s][sc]sidechaincompress=threshold=0.05:ratio=3:attack=10:release=300[sd];[o][sd]amix=inputs=2:normalize=0,afade=t=out:st=101.2:d=1.2,alimiter=limit=0.95[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "$2"
