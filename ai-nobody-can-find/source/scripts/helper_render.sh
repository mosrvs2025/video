#!/bin/sh
# Render a range of chunks on a helper machine and hand them back through a throwaway branch.
#   sh scripts/helper_render.sh <Composition> <first-last chunk> <parts-branch> [scale]
# e.g. sh scripts/helper_render.sh Film 2-3 render-parts/film-a
set -e
cd "$(dirname "$0")/.."
COMP=$1; RANGE=$2; BR=$3; SCALE=${4:-1}
T0=$(date +%s)
[ -d node_modules/remotion ] || npm install --no-audit --no-fund --loglevel=error
T1=$(date +%s)
python3 scripts/render.py "$COMP" /dev/null "$SCALE" --chunks "$RANGE"
T2=$(date +%s)
D=data/chunks_${COMP}_$(python3 -c "print(f'{float(\"$SCALE\"):g}')")
git checkout -q -B "$BR"
git add -f "$D"/[0-9]*.mp4
git -c user.name="render-helper" -c user.email="render-helper@users.noreply.github.com" commit -q -m "render parts $COMP $RANGE (setup $((T1-T0))s, render $((T2-T1))s)"
git push -q -u origin "$BR"
echo "DONE $COMP $RANGE setup=$((T1-T0))s render=$((T2-T1))s pushed=$BR"
