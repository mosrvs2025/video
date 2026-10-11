#!/bin/bash
# compress.sh <in.mp4> <out.mp4>  -> 720x1280, ~640 kbps video + 112 kbps AAC (< 30 MiB for a ~5 min song)
ffmpeg -v error -y -i "$1" -vf "scale=720:1280:flags=lanczos,hqdn3d=3:3:6:6" -c:v libx264 -preset slow -b:v 640k -maxrate 820k -bufsize 1640k -profile:v high -pix_fmt yuv420p -c:a aac -b:a 112k -movflags +faststart "$2"
