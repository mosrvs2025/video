#!/bin/sh
# stop any running render (patterns live in this file so callers do not match themselves)
pkill -f "scripts/render.py" ; sleep 1 ; pkill -f "cli.js render" ; pkill -f "remotion render" ; sleep 2 ; pkill -f "chrome-linux/headless" ; sleep 1 ; echo stopped
