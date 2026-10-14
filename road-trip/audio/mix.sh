#!/bin/sh
# usage: audio/mix.sh silent.mp4 out.mp4  (original audio incl. radio is leveled; sfx layered on top)
ffmpeg -v error -y -i "$1" -i audio/original.mp4 -i audio/sfx.wav -filter_complex \
"[1:a]highpass=f=60,loudnorm=I=-15:TP=-1.5:LRA=9,apad=whole_dur=54.67,aformat=channel_layouts=stereo:sample_rates=44100,afade=t=out:st=53.5:d=1.1[o];\
[2:a]volume=0.55[s];[o][s]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 54.67 "$2"
