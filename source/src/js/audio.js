/* Sons synthétisés (WebAudio) : aucun fichier, aucun son emprunté. */
(function (root) {
  let ctx = null, master = null, enabled = true, unlocked = false, applauseBuf = null, noiseBuf = null;
  try { const v = localStorage.getItem('ac.sound'); if (v !== null) enabled = v === '1'; } catch (e) { /* stockage indisponible */ }

  function ensure() {
    if (!enabled || !unlocked) return null;
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function noise() {
    if (noiseBuf) return noiseBuf;
    const len = ctx.sampleRate * 1.5; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function tone(freq, dur, opts) {
    const c = ensure(); if (!c) return;
    const o = Object.assign({ type: 'sine', gain: 0.05, attack: 0.004, delay: 0, to: null }, opts || {});
    const t = c.currentTime + o.delay;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type; osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain, t + o.attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + dur + 0.05);
  }
  function burst(dur, opts) {
    const c = ensure(); if (!c) return;
    const o = Object.assign({ gain: 0.2, freq: 1200, q: 1, type: 'bandpass', to: null, delay: 0, attack: 0.003 }, opts || {});
    const t = c.currentTime + o.delay;
    const src = c.createBufferSource(); src.buffer = noise();
    const f = c.createBiquadFilter(); f.type = o.type; f.frequency.setValueAtTime(o.freq, t); f.Q.value = o.q;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain, t + o.attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  function applause(level) {
    const c = ensure(); if (!c) return;
    if (!applauseBuf) {
      const sr = c.sampleRate, len = Math.floor(sr * 3.2);
      applauseBuf = c.createBuffer(1, len, sr);
      const d = applauseBuf.getChannelData(0);
      const claps = 420;
      for (let k = 0; k < claps; k++) {
        const tt = Math.pow(Math.random(), 1.6) * 2.9;
        const start = Math.floor(tt * sr), dec = 0.006 + Math.random() * 0.012, amp = (0.25 + Math.random() * 0.75) * (1 - tt / 3.3);
        const n = Math.floor(dec * sr * 5);
        for (let i = 0; i < n && start + i < len; i++) d[start + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / (dec * sr));
      }
      let mx = 0; for (let i = 0; i < len; i++) mx = Math.max(mx, Math.abs(d[i]));
      for (let i = 0; i < len; i++) d[i] /= (mx || 1);
    }
    const src = c.createBufferSource(); src.buffer = applauseBuf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0.32 * (level || 1);
    src.connect(f); f.connect(g); g.connect(master); src.start();
  }

  const Sfx = {
    get enabled() { return enabled; },
    setEnabled(v) { enabled = !!v; try { localStorage.setItem('ac.sound', enabled ? '1' : '0'); } catch (e) { /* ignoré */ } if (enabled) ensure(); },
    unlock() { unlocked = true; ensure(); },
    nav() { tone(1480, 0.06, { gain: 0.03 }); },
    cat() { tone(980, 0.09, { type: 'triangle', gain: 0.04 }); tone(1470, 0.08, { gain: 0.015, delay: 0.015 }); },
    open() { tone(660, 0.16, { gain: 0.045 }); tone(990, 0.22, { gain: 0.035, delay: 0.05 }); },
    back() { tone(880, 0.12, { gain: 0.035, to: 560 }); },
    deny() { tone(220, 0.14, { type: 'square', gain: 0.02 }); },
    meter() { tone(1200, 0.04, { type: 'triangle', gain: 0.03 }); },
    swoosh() { burst(0.32, { freq: 500, to: 2400, q: 0.9, gain: 0.12 }); },
    hit(kind, power) {
      const p = Math.max(0.3, Math.min(1.1, power || 1));
      if (kind === 'putt') { tone(950, 0.08, { type: 'triangle', gain: 0.06 * p }); burst(0.04, { freq: 2500, gain: 0.05 }); return; }
      if (kind === 'wood') { tone(2300, 0.18, { gain: 0.06 * p, to: 1600 }); burst(0.06, { freq: 3500, q: 0.7, gain: 0.28 * p }); return; }
      burst(0.05, { freq: 2600, q: 0.8, gain: 0.3 * p }); tone(540, 0.1, { type: 'triangle', gain: 0.06 * p });
    },
    land(surface) {
      if (surface === 'sand') burst(0.25, { freq: 800, q: 0.4, gain: 0.12, type: 'lowpass' });
      else burst(0.12, { freq: 300, q: 0.7, gain: 0.12, type: 'lowpass' });
    },
    tree() { burst(0.35, { freq: 2200, q: 0.4, gain: 0.12 }); tone(180, 0.1, { type: 'triangle', gain: 0.05, delay: 0.05 }); },
    splash() { burst(0.7, { freq: 2600, to: 300, q: 0.5, gain: 0.25, type: 'lowpass' }); },
    cup() { tone(620, 0.12, { type: 'triangle', gain: 0.08 }); tone(460, 0.16, { type: 'triangle', gain: 0.07, delay: 0.09 }); burst(0.12, { freq: 1800, gain: 0.07, delay: 0.14 }); },
    applause,
    chime() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.9, { type: 'sine', gain: 0.05, delay: i * 0.12, attack: 0.02 })); tone(1046, 1.2, { type: 'triangle', gain: 0.025, delay: 0.5, attack: 0.03 }); },
    ding() { tone(988, 0.25, { gain: 0.05 }); tone(1480, 0.35, { gain: 0.04, delay: 0.09 }); },
    pop() { tone(620, 0.07, { type: 'triangle', gain: 0.04, to: 880 }); },
    bump(p) { const g = 0.012 + (p || 0.5) * 0.05; tone(330, 0.07, { type: 'triangle', gain: g, to: 190 }); burst(0.03, { freq: 950, q: 1.2, gain: g * 2.2 }); },
    boing(p) { const g = 0.03 + (p || 0.5) * 0.04; tone(290, 0.22, { gain: g, to: 760 }); tone(580, 0.16, { type: 'triangle', gain: g * 0.4, to: 1250, delay: 0.02 }); },
    shut() { tone(700, 0.09, { type: 'triangle', gain: 0.035, to: 420 }); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', gain: 0.045, delay: i * 0.09 })); }
  };
  root.Sfx = Sfx;
})(typeof window !== 'undefined' ? window : globalThis);
