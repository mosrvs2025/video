#!/usr/bin/env python3
"""Bundle everything the renderer needs into <song>/work/data.json:
timeline (aligned lines/chunks), beats (+ 30 fps band energies), scene spec, YOU slots."""
import json, os, sys
song = os.path.abspath(sys.argv[1]); work = f"{song}/work"
T = json.load(open(f"{work}/timeline.json")); B = json.load(open(f"{work}/beats.json"))
spec = json.load(open(f"{song}/scenes.json")); sl = json.load(open(f"{song}/slots.json"))
json.dump({"timeline": T, "beats": B, "spec": spec, "slots": sl["slots"]}, open(f"{work}/data.json", "w"))
print("wrote data.json", os.path.getsize(f"{work}/data.json") // 1024, "KB")
