// ===== audio features (from pipeline/music.py) -> stateless accessors usable from any frame =====
window.AU = (() => {
  let M = null;
  const dec = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const api = {
    init(m) { M = { ...m }; for (const k of ['bands', 'chroma', 'kick_env', 'snare_env', 'hat_env', 'bass', 'strings', 'pitch', 'vocal']) M[k] = dec(m[k]); api.ready = true; },
    ready: false,
    at(arr, t) { const x = t * M.fps, i = Math.floor(x), f = x - i, n = M.n - 1; return (arr[cl(i, 0, n)] * (1 - f) + arr[cl(i + 1, 0, n)] * f) / 255; },
    kick: t => M ? api.at(M.kick_env, t) : 0, snare: t => M ? api.at(M.snare_env, t) : 0, hat: t => M ? api.at(M.hat_env, t) : 0,
    bass: t => M ? api.at(M.bass, t) : 0, strings: t => M ? api.at(M.strings, t) : 0, pitch: t => M ? api.at(M.pitch, t) : 0, vocal: t => M ? api.at(M.vocal, t) : 0,
    band(k, t) { if (!M) return 0; const i = cl(Math.round(t * M.fps), 0, M.n - 1); return M.bands[i * 64 + cl(k, 0, 63)] / 255; },
    chroma(k, t) { if (!M) return 0; const i = cl(Math.round(t * M.fps), 0, M.n - 1); return M.chroma[i * 12 + k] / 255; },
    // events [t, strength] with t in (now - win, now]; binary search on sorted list
    recent(name, t, win) { const L = M ? M[name] : []; let lo = 0, hi = L.length; while (lo < hi) { const m = (lo + hi) >> 1; if (L[m][0] <= t) lo = m + 1; else hi = m; }
      const out = []; for (let i = lo - 1; i >= 0 && L[i][0] > t - win; i--) out.push(L[i]); return out; },
  };
  return api;
})();
