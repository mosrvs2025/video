"""Automatic subject tracking: Haar face detection every N frames spawns CSRT trackers (streaming, one pass).
Output: list of tracks {id, a, b, fps, boxes:[[cx,cy,w,h] normalized per frame from a]} cached in analysis/<clip>/tracks.json"""
import cv2, json, os, sys
import numpy as np

def iou(a, b):
    ax0, ay0, ax1, ay1 = a[0], a[1], a[0] + a[2], a[1] + a[3]; bx0, by0, bx1, by1 = b[0], b[1], b[0] + b[2], b[1] + b[3]
    iw = max(0, min(ax1, bx1) - max(ax0, bx0)); ih = max(0, min(ay1, by1) - max(ay0, by0)); i = iw * ih
    u = a[2] * a[3] + b[2] * b[3] - i
    return i / u if u > 0 else 0

def track_clip(path, outdir, force=False, min_len=1.2, max_len=14.0, detect_every=8):
    jf = os.path.join(outdir, 'tracks.json')
    if os.path.exists(jf) and not force: return json.load(open(jf))
    cas = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
    cas2 = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
    cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS) or 30
    active = []; done = []; fi = 0; tid = 0
    while True:
        ok, fr = cap.read()
        if not ok: break
        H0, W0 = fr.shape[:2]; sc = 480 / W0 if W0 > 480 else 1.0
        im = cv2.resize(fr, (int(W0 * sc), int(H0 * sc))) if sc != 1 else fr
        H, W = im.shape[:2]
        for t in active[:]:
            ok2, bb = t['tr'].update(im)
            if not ok2 or bb[2] < 6 or bb[3] < 6 or bb[0] < -bb[2] * 0.5 or bb[0] > W:
                active.remove(t); done.append(t); continue
            t['boxes'].append([(bb[0] + bb[2] / 2) / W, (bb[1] + bb[3] / 2) / H, bb[2] / W, bb[3] / H]); t['last'] = fi
            if (fi - t['start']) / fps > max_len: active.remove(t); done.append(t)
        if fi % detect_every == 0:
            g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY); g = cv2.equalizeHist(g)
            faces = list(cas.detectMultiScale(g, 1.1, 5, minSize=(int(W * 0.07), int(W * 0.07))))
            if not faces: faces = list(cas2.detectMultiScale(g, 1.1, 6, minSize=(int(W * 0.09), int(W * 0.09))))
            for (x, y, w, h) in faces:
                box = (x, y, w, h)
                if any(iou(box, t['cur']) > 0.25 for t in active if 'cur' in t) : continue
                # also refresh: if inside an active tracker bbox, skip
                skip = False
                for t in active:
                    bx = t['boxes'][-1]; tb = (bx[0] * W - bx[2] * W / 2, bx[1] * H - bx[3] * H / 2, bx[2] * W, bx[3] * H)
                    if iou(box, tb) > 0.2: skip = True; break
                if skip: continue
                tr = cv2.TrackerCSRT_create(); tr.init(im, box)
                tid += 1
                # a face box is small; grow to head+shoulders for a nicer bracket
                active.append({'id': tid, 'tr': tr, 'start': fi, 'boxes': [[(x + w / 2) / W, (y + h / 2) / H, w / W, h / H]], 'cur': box, 'last': fi})
            for t in active:
                bx = t['boxes'][-1]; t['cur'] = (bx[0] * W - bx[2] * W / 2, bx[1] * H - bx[3] * H / 2, bx[2] * W, bx[3] * H)
        fi += 1
    done += active
    out = []
    for t in done:
        n = len(t['boxes'])
        if n / fps < min_len: continue
        bx = np.array(t['boxes'])
        k = 5
        sm = np.stack([np.convolve(np.pad(bx[:, j], (k, k), mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), 'valid') for j in range(4)], 1)
        out.append({'id': t['id'], 'a': round(t['start'] / fps, 3), 'b': round((t['start'] + n) / fps, 3), 'fps': fps, 'boxes': [[round(float(v), 4) for v in r] for r in sm]})
    json.dump(out, open(jf, 'w'))
    return out

if __name__ == '__main__':
    r = track_clip(sys.argv[1], sys.argv[2], force='--force' in sys.argv)
    print([(t['id'], t['a'], t['b'], round(float(np.mean([b[2] for b in t['boxes']])), 3)) for t in r])
