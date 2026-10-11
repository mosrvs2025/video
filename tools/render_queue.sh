#!/bin/bash
# render_queue.sh <songDir> <totalFrames> [segFrames=600] [workers=4] [skipSeg ...]
# Renders 20 s segments in song order with N parallel workers: seg_XX finishes in order, so early parts are watchable while later ones render.
song=$1; total=$2; seg=${3:-600}; workers=${4:-4}; shift 4; skip=" $* "
n=$(( (total + seg - 1) / seg )); jobs=""
for ((k=0;k<n;k++)); do [[ "$skip" == *" $k "* ]] && continue; a=$((k*seg)); b=$(( (k+1)*seg )); ((b>total)) && b=$total; jobs+="$k $a $b\n"; done
printf "$jobs" | xargs -P $workers -L1 bash -c 'node engine/render.js '"$song"' $1 $2 '"$song"'/render/chunk_$(printf %02d $0).mp4 30 > '"$song"'/render/chunk_$(printf %02d $0).log 2>&1'
