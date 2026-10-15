#!/bin/sh
# One-time setup: python venv + models. Safe to re-run.
set -e
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
[ -d node_modules ] || npm install --no-audit --no-fund
.venv/bin/python pipeline/models.py
echo "studio ready"
