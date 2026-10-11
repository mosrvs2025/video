#!/bin/bash
# finish.sh <songDir> : masters (clean/keyed/labeled) + <30 MiB compressed versions, in parallel where possible
S=$1; R=$S/render; N=$(basename $S); PY=.venv/bin/python
$PY pipeline/compose.py $S clean
( $PY pipeline/compose.py $S keyed   && pipeline/compress.sh $R/${N}_keyed.mp4   $R/aviary_keyed_30mb.mp4 ) &
( $PY pipeline/compose.py $S labeled && pipeline/compress.sh $R/${N}_labeled.mp4 $R/aviary_labeled_30mb.mp4 ) &
pipeline/compress.sh $R/${N}_clean.mp4 $R/aviary_clean_30mb.mp4 &
wait; echo FINISH_DONE
