"""Split a final render across helper cloud sessions.

  python3 scripts/fanout.py plan  <Composition> <helpers>      -> prints the chunk range and the exact helper prompt for each helper
  python3 scripts/fanout.py collect <Composition> <branch>...   -> fetches each helper's parts branch and copies its chunks into
                                                                  data/chunks_<Composition>_1/ (each helper then deletes its own branch), then you run
                                                                  `python3 scripts/render.py <Composition> data/<x>_silent.mp4 1` to
                                                                  render anything missing and concatenate.
Helpers render byte-identical chunks (verified: SSIM 1.000, identical file sizes), so parts can be mixed freely with local ones.
Chunks that already exist locally are skipped by the plan, so a re-render after an edit only farms out what changed.
"""
import json, math, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); REPO = os.path.dirname(os.path.dirname(ROOT))
def total_chunks(comp):
    n = math.ceil(json.load(open(os.path.join(ROOT, 'src', 'audio.json')))['dur'] * 30) // (2 if comp == 'ExpDraft' else 1)
    return (n + 299) // 300
def plan(comp, helpers):
    cd = os.path.join(ROOT, 'data', f'chunks_{comp}_1'); have = set(os.listdir(cd)) if os.path.isdir(cd) else set()
    todo = [i for i in range(total_chunks(comp)) if f'{i:04d}.mp4' not in have]
    if not todo: print('nothing to render'); return
    # contiguous runs, split as evenly as possible
    k = min(helpers, len(todo)); size = math.ceil(len(todo) / k); groups = [todo[i:i + size] for i in range(0, len(todo), size)]
    for gi, g in enumerate(groups):
        runs, s = [], g[0]
        for a, b in zip(g, g[1:] + [None]):
            if b != a + 1: runs.append(f'{s}-{a}'); s = b
        br = f'render-parts/{comp.lower()}-{gi + 1}'
        cmds = ' && '.join(f'sh scripts/helper_render.sh {comp} {r} {br}' for r in runs)
        print(f'--- helper {gi + 1}: chunks {",".join(runs)}  branch {br}\ncd ai-nobody-can-find/source && {cmds}\n')
def collect(comp, branches):
    cd = os.path.join(ROOT, 'data', f'chunks_{comp}_1'); os.makedirs(cd, exist_ok=True); rel = f'ai-nobody-can-find/source/data/chunks_{comp}_1'
    for br in branches:
        subprocess.run(['git', '-C', REPO, 'fetch', '-q', 'origin', br], check=True)
        files = subprocess.run(['git', '-C', REPO, 'ls-tree', '--name-only', 'FETCH_HEAD', rel + '/'], capture_output=True, text=True).stdout.split()
        for f in files:
            with open(os.path.join(cd, os.path.basename(f)), 'wb') as o: o.write(subprocess.run(['git', '-C', REPO, 'show', f'FETCH_HEAD:{f}'], capture_output=True).stdout)
        print(br, '->', len(files), 'chunks  (ask the helper session to delete this branch: only the session that owns it may push to it)')
if __name__ == '__main__':
    if sys.argv[1] == 'plan': plan(sys.argv[2], int(sys.argv[3]))
    else: collect(sys.argv[2], sys.argv[3:])
