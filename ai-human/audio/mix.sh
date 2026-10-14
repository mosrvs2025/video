#!/bin/sh
# usage: audio/mix.sh silent.mp4 out.mp4 ; voice is denoised/leveled, score is ducked under it
ffmpeg -v error -y -i "$1" -i audio/voice.m4a -i audio/score.wav -filter_complex \
"[1:a]highpass=f=90,afftdn=nf=-30,acompressor=threshold=-24dB:ratio=3:attack=10:release=150,loudnorm=I=-14:TP=-1.5:LRA=7,apad=whole_dur=50,aformat=channel_layouts=stereo:sample_rates=44100,asplit[v1][v2];\
[2:a]volume=0.62[m];[m][v2]sidechaincompress=threshold=0.035:ratio=5:attack=15:release=400[md];\
[v1][md]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 50 "$2"
