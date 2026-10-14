#!/bin/sh
# usage: audio/mix.sh silent.mp4 out.mp4  (road + beach original audio, leveled and joined; sfx on top)
ffmpeg -v error -y -i "$1" -i audio/combined.wav -i audio/sfx.wav -filter_complex \
"[1:a]afade=t=out:st=75.8:d=1.0[o];[2:a]volume=0.55[s];[o][s]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 76.84 "$2"
