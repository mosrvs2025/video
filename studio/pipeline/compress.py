"""Video compressor (what phone "compress video" apps do, but with measurable quality):
  python3 pipeline/compress.py in.mp4 [--preset share|small|tiny] [--target-mb 8] [-o out.mp4]
presets
  share  H.264 720p CRF26   plays everywhere (iMessage/WhatsApp/IG/TikTok)         ~ 1/6 of a typical Remotion render
  small  HEVC  720p CRF30   half the size of share, plays on iPhone/Android/Mac/Windows modern players
  tiny   AV1   540p CRF40   smallest; for archives/repo previews (modern browsers/phones; VLC)
--target-mb does two-pass bitrate targeting (share/small) or VBR (tiny) so the file lands at ~that size.
Prints size, ratio and SSIM against the original so quality loss is a number, not a guess."""
import json, os, re, subprocess, sys, tempfile

PRESETS = {
    'share': dict(v=['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p'], crf=26, h=1280, a=['-c:a', 'aac', '-b:a', '96k'], cf='-crf'),
    'small': dict(v=['-c:v', 'libx265', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-tag:v', 'hvc1'], crf=30, h=1280, a=['-c:a', 'aac', '-b:a', '64k'], cf='-crf'),
    'tiny':  dict(v=['-c:v', 'libsvtav1', '-preset', '6', '-pix_fmt', 'yuv420p'], crf=40, h=960, a=['-c:a', 'aac', '-b:a', '48k'], cf='-crf'),
}

def probe(p):
    j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', p], capture_output=True, text=True).stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    return float(j['format']['duration']), int(v['width']), int(v['height']), os.path.getsize(p)

def ssim(ref, cmp_, w=540):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', cmp_, '-i', ref, '-lavfi', f'[0:v]scale={w}:-2:flags=bicubic[a];[1:v]scale={w}:-2:flags=bicubic[b];[a][b]ssim', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.search(r'All:([0-9.]+)', r.stderr); return float(m.group(1)) if m else float('nan')

def compress(src, out=None, preset='share', target_mb=None, crf=None):
    P = PRESETS[preset]; dur, w, h, size0 = probe(src)
    out = out or os.path.splitext(src)[0] + f'.{preset}.mp4'
    vf = f"scale=-2:'min(ih,{P['h']})':flags=lanczos"
    base = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-map', '0:v:0', '-map', '0:a:0?']
    if target_mb:
        ab = int(re.search(r'(\d+)k', P['a'][-1]).group(1)); vb = max(80, int((target_mb * 8192 * 0.96) / dur - ab))  # kbit/s
        if preset == 'tiny':
            cmd = base + P['v'] + ['-b:v', f'{vb}k', '-svtav1-params', 'rc=1'] + P['a'] + ['-movflags', '+faststart', out]; subprocess.run(cmd, check=True)
        else:
            log = tempfile.mktemp()
            if preset == 'share':
                subprocess.run(base + P['v'] + ['-b:v', f'{vb}k', '-pass', '1', '-passlogfile', log, '-an', '-f', 'mp4', '/dev/null'], check=True)
                subprocess.run(base + P['v'] + ['-b:v', f'{vb}k', '-pass', '2', '-passlogfile', log] + P['a'] + ['-movflags', '+faststart', out], check=True)
            else:
                subprocess.run(base + P['v'] + ['-b:v', f'{vb}k', '-x265-params', f'pass=1:stats={log}:log-level=error', '-an', '-f', 'mp4', '/dev/null'], check=True)
                subprocess.run(base + P['v'] + ['-b:v', f'{vb}k', '-x265-params', f'pass=2:stats={log}:log-level=error'] + P['a'] + ['-movflags', '+faststart', out], check=True)
    else:
        extra = ['-x265-params', 'log-level=error'] if preset == 'small' else []
        subprocess.run(base + P['v'] + [P['cf'], str(crf or P['crf'])] + extra + P['a'] + ['-movflags', '+faststart', out], check=True)
    size1 = os.path.getsize(out); q = ssim(src, out)
    print(f"{os.path.basename(src)} -> {os.path.basename(out)}  {size0 / 1e6:.1f} MB -> {size1 / 1e6:.2f} MB  ({size0 / size1:.0f}x smaller)  SSIM {q:.4f}  {size1 * 8 / dur / 1000:.0f} kbit/s")
    return out, size1, q

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit()
    src = a[0]; preset = a[a.index('--preset') + 1] if '--preset' in a else 'share'
    tgt = float(a[a.index('--target-mb') + 1]) if '--target-mb' in a else None
    out = a[a.index('-o') + 1] if '-o' in a else None
    compress(src, out, preset, tgt)
