#!/bin/sh
# usage: audio/mix.sh silent.mp4 out.mp4   (original audio is normalised, score is ducked under it)
ffmpeg -v error -y -i "$1" -i public/walk.mp4 -i audio/score.wav -filter_complex \
"[1:a]highpass=f=80,loudnorm=I=-15:TP=-1.5:LRA=11,apad=whole_dur=45.5,aformat=channel_layouts=stereo:sample_rates=44100,asplit[v1][v2];\
[2:a]volume=0.6[m];[m][v2]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=450[md];\
[v1][md]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 45.5 "$2"
