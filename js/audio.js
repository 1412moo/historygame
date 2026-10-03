// 간단한 효과음 (WebAudio로 직접 합성 - 외부 음원 파일 없음)
(function () {
  const TT = (window.TT = window.TT || {});
  let ac = null;
  function audio() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type, vol, when, slide) {
    if (TT.state && TT.state.muted) return;
    const a = audio();
    if (!a) return;
    const t = a.currentTime + (when || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  TT.sfx = {
    blip() { tone(560 + Math.random() * 90, 0.035, 'square', 0.018); },
    select() { tone(660, 0.06, 'square', 0.035); tone(990, 0.08, 'square', 0.03, 0.05); },
    bump() { tone(110, 0.08, 'triangle', 0.07); },
    door() { tone(320, 0.12, 'triangle', 0.07, 0, 0.6); tone(220, 0.16, 'triangle', 0.05, 0.09); },
    good() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, 'square', 0.035, i * 0.07)); },
    bad() { tone(240, 0.14, 'sawtooth', 0.03); tone(180, 0.2, 'sawtooth', 0.025, 0.11); },
    pop() { tone(700, 0.09, 'sine', 0.09, 0, 1.6); },
    reward() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.06, i * 0.09)); },
    bell() { [0, 1.0].forEach(w => { tone(880, 1.5, 'sine', 0.12, w); tone(1320, 1.0, 'sine', 0.05, w); tone(440, 1.8, 'sine', 0.06, w); }); },
    water() { for (let i = 0; i < 7; i++) tone(380 + Math.random() * 520, 0.07, 'sine', 0.035, i * 0.08); },
    warp() { tone(180, 1.0, 'sine', 0.08, 0, 6); tone(270, 1.0, 'triangle', 0.04, 0.15, 4); },
    unlock: audio,
  };

  // ================================================================= 배경 음악
  // 평조(솔·라·도·레·미) 5음 음계 + 가야금 느낌 뜯는 소리 + 대금 느낌 피리 + 장구(굿거리 장단 단순화)
  const SCALE = [55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79]; // G3 A3 C4 D4 E4 G4 A4 C5 D5 E5 G5
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const TOWN = [
    [[7, 3], [8, 2], [7, 1], [6, 3], [5, 3]], [[6, 2], [7, 1], [8, 3], [9, 6]],
    [[9, 3], [8, 2], [7, 1], [8, 3], [6, 3]], [[7, 6], [-1, 3], [5, 3]],
    [[6, 3], [7, 2], [8, 1], [9, 3], [10, 3]], [[9, 2], [8, 1], [7, 3], [8, 6]],
    [[7, 3], [6, 2], [5, 1], [6, 3], [4, 3]], [[5, 9], [-1, 3]],
  ];
  const SLOW = [
    [[7, 6], [8, 2]], [[9, 4], [8, 2], [7, 2]], [[6, 8]], [[5, 4], [6, 4]],
    [[7, 4], [9, 4]], [[8, 6], [7, 2]], [[6, 4], [5, 4]], [[5, 8]],
  ];
  const STUDY = [
    [[5, 2], [7, 2], [6, 2], [5, 2]], [[4, 2], [5, 2], [6, 4]], [[7, 2], [8, 2], [7, 2], [6, 2]], [[5, 6], [-1, 2]],
    [[6, 2], [7, 2], [8, 2], [9, 2]], [[8, 2], [7, 2], [6, 4]], [[5, 2], [6, 2], [4, 2], [3, 2]], [[5, 6], [-1, 2]],
  ];
  // 굿거리(12/8) 단순화: 덩(D) 쿵(K) 덕(d)
  const GUTGEORI = { 0: 'D', 3: 'K', 4: 'd', 6: 'D', 8: 'd', 9: 'K', 10: 'd' };
  const THEMES = {
    town: { bars: TOWN, bar: 12, step: 0.19, lead: 'pluck', lv: 0.13, bass: [0, 3, 2, 0, 2, 3, 0, 0], bassAt: [0, 6], bv: 0.09, drums: GUTGEORI, dv: 0.11 },
    palace: { bars: SLOW, bar: 8, step: 0.32, lead: 'flute', lv: 0.09, bass: [0, 2, 3, 0, 2, 3, 0, 0], bassAt: [0], bv: 0.08, drums: { 0: 'K' }, dv: 0.07 },
    study: { bars: STUDY, bar: 8, step: 0.25, lead: 'pluck', lv: 0.11, bass: [0, 2, 3, 0, 3, 2, 0, 0], bassAt: [0, 4], bv: 0.06, drums: {}, dv: 0 },
    workshop: { bars: STUDY, bar: 8, step: 0.19, lead: 'pluck', lv: 0.11, bass: [0, 2, 3, 0, 3, 2, 0, 0], bassAt: [0, 4], bv: 0.07, drums: { 0: 'K', 3: 'd', 4: 'd', 6: 'K' }, dv: 0.07 },
    title: { bars: SLOW, bar: 8, step: 0.28, lead: 'flute', lv: 0.09, bass: [0, 2, 3, 0, 2, 3, 0, 0], bassAt: [0, 4], bv: 0.07, drums: {}, dv: 0 },
  };
  const MAP_THEME = { hanyang: 'town', palace_in: 'palace', jiphyeon_in: 'study', workshop_in: 'workshop' };

  let ducked = false;
  let mGain = null, noise = null, timer = null, cur = null, compiled = null, stepIdx = 0, nextT = 0, paused = false, token = 0, pending = null;
  function ensure() {
    const a = audio();
    if (!a) return null;
    if (!mGain) {
      mGain = a.createGain(); mGain.gain.value = 0; mGain.connect(a.destination);
      noise = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate);
      const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return a;
  }
  function env(a, t, v, atk, hold, rel) {
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + atk);
    if (hold > 0) g.gain.setValueAtTime(v, t + atk + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + atk + Math.max(0, hold) + rel);
    g.connect(mGain);
    return g;
  }
  const INST = {
    pluck(a, t, f, dur, v) { // 가야금: 살짝 높게 튕겨서 내려앉는 음
      const g = env(a, t, v, 0.005, 0, Math.min(1.4, 0.5 + dur));
      const o = a.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(f * 1.025, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07);
      if (dur > 0.7) { o.frequency.setValueAtTime(f, t + dur * 0.5); o.frequency.linearRampToValueAtTime(f * 1.012, t + dur * 0.7); o.frequency.linearRampToValueAtTime(f, t + dur * 0.9); }
      const o2 = a.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
      const g2 = a.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(g);
      o.connect(g); const end = t + Math.min(1.5, 0.6 + dur);
      o.start(t); o2.start(t); o.stop(end); o2.stop(end);
    },
    flute(a, t, f, dur, v) { // 대금: 부드럽게 시작, 떨림(농음)
      const g = env(a, t, v, 0.09, Math.max(0, dur - 0.15), 0.25);
      const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const lfo = a.createOscillator(); lfo.frequency.value = 5; const lg = a.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.008, t + Math.min(0.5, dur));
      lfo.connect(lg); lg.connect(o.frequency);
      const n = a.createBufferSource(); n.buffer = noise; n.loop = true;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 2;
      const ng = a.createGain(); ng.gain.value = 0.18; n.connect(bp); bp.connect(ng); ng.connect(g);
      o.connect(g); const end = t + dur + 0.4;
      [o, lfo, n].forEach(x => { x.start(t); x.stop(end); });
    },
  };
  function drum(a, t, type, v) {
    if (type === 'D' || type === 'K') { // 쿵: 북편
      const g = env(a, t, v, 0.004, 0, 0.32);
      const o = a.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.2);
      o.connect(g); o.start(t); o.stop(t + 0.4);
    }
    if (type === 'D' || type === 'd') { // 덕: 채편
      const g = env(a, t, v * 0.7, 0.002, 0, 0.08);
      const n = a.createBufferSource(); n.buffer = noise;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 1.2;
      n.connect(bp); bp.connect(g); n.start(t); n.stop(t + 0.12);
    }
  }
  function compile(th) {
    const total = th.bars.length * th.bar;
    const steps = Array.from({ length: total }, () => []);
    th.bars.forEach((bar, bi) => {
      let pos = bi * th.bar;
      bar.forEach(([n, len]) => { if (n >= 0) steps[pos].push({ k: 'lead', m: SCALE[n], len }); pos += len; });
      th.bassAt.forEach(off => steps[bi * th.bar + off].push({ k: 'bass', m: SCALE[th.bass[bi]] - 12 + (off ? 7 : 0), len: th.bar / th.bassAt.length }));
      Object.entries(th.drums).forEach(([off, type]) => steps[bi * th.bar + +off].push({ k: 'drum', type }));
    });
    return steps;
  }
  function tick() {
    const a = ac;
    if (!a || !cur || paused) return;
    const th = THEMES[cur];
    while (nextT < a.currentTime + 0.3) {
      for (const ev of compiled[stepIdx]) {
        if (ev.k === 'lead') INST[th.lead](a, nextT, hz(ev.m), ev.len * th.step, th.lv);
        else if (ev.k === 'bass') INST.pluck(a, nextT, hz(ev.m), ev.len * th.step, th.bv);
        else drum(a, nextT, ev.type, th.dv);
      }
      nextT += th.step;
      stepIdx = (stepIdx + 1) % compiled.length;
    }
  }
  const musicOn = () => !(TT.state && (TT.state.musicOff));
  TT.music = {
    play(name) {
      if (!THEMES[name]) return;
      const a = ensure();
      if (!a) return;
      if (name === cur && timer) { this.apply(); return; }
      if (name === pending) return;
      const my = ++token;
      pending = name;
      const start = () => {
        if (my !== token) return;
        pending = null;
        cur = name; compiled = compile(THEMES[name]); stepIdx = 0; nextT = a.currentTime + 0.08;
        if (!timer) timer = setInterval(tick, 60);
        tick();
        this.apply();
      };
      if (cur) { // 이전 곡을 살짝 줄이고 새 곡으로
        mGain.gain.cancelScheduledValues(a.currentTime);
        mGain.gain.setTargetAtTime(0, a.currentTime, 0.12);
        cur = null;
        setTimeout(start, 500);
      } else start();
    },
    forMap(id) { this.play(MAP_THEME[id] || 'town'); },
    apply() { // 켜기/끄기 상태 반영
      if (!mGain || !ac) return;
      mGain.gain.cancelScheduledValues(ac.currentTime);
      mGain.gain.setTargetAtTime(musicOn() && !paused ? (ducked ? 0.22 : 0.55) : 0, ac.currentTime, ducked ? 0.1 : 0.4);
    },
    duck(d) { if (ducked !== d) { ducked = d; this.apply(); } },
    pause(p) { paused = p; if (!p) { if (ac) nextT = ac.currentTime + 0.1; } this.apply(); },
    current: () => cur,
  };
  document.addEventListener('visibilitychange', () => TT.music.pause(document.hidden));
})();
