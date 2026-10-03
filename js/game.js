// 게임 엔진: 루프, 입력, 이동/충돌, 카메라, 렌더링, 저장
(function () {
  const TT = window.TT;
  const T = TT.T;
  const ui = TT.ui;
  const TILE = 32;
  const SAVE_KEY = 'timetraveler_save_v1';
  const DIRV = [[0, 1], [-1, 0], [1, 0], [0, -1]]; // 0 아래, 1 왼쪽, 2 오른쪽, 3 위
  const key = TT.key;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, tileDev = 64, sc = 2;
  let tileCache = {};

  TT.maps = TT.buildMaps();
  TT.busy = false;
  TT.started = false;

  // ---------------------------------------------------------------- 상태 & 저장
  TT.newState = () => ({ v: 1, name: '하늘', step: 0, stories: {}, talked: {}, shards: 0, dex: {}, flags: {}, pos: { map: 'hanyang', x: 21, y: 40, dir: 3 }, muted: false });
  TT.state = TT.newState();
  TT.save = function () {
    if (!TT.started) return;
    try {
      const p = TT.player;
      if (p && TT.map) TT.state.pos = { map: TT.map.id, x: p.x, y: p.y, dir: p.dir };
      localStorage.setItem(SAVE_KEY, JSON.stringify(TT.state));
    } catch (e) { /* 저장 불가 환경 */ }
  };
  TT.loadSave = function () {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) return s; } catch (e) {}
    return null;
  };
  TT.resetGame = function () {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    location.reload();
  };

  // ---------------------------------------------------------------- 맵 준비
  const ROADLIKE = new Set([T.ROAD, T.PLAZA, T.BRIDGE, T.EXIT]);
  function prepareMap(m) {
    m.vari = new Uint8Array(m.w * m.h);
    m.mask = new Uint8Array(m.w * m.h);
    const g = (x, y) => TT.getTile(m, x, y);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const i = y * m.w + x, id = m.tiles[i];
      m.vari[i] = TT.hash(x, y) % 4;
      const nb = [g(x, y - 1), g(x + 1, y), g(x, y + 1), g(x - 1, y)];
      let same;
      if (id === T.ROAD) same = t => t === -1 || ROADLIKE.has(t);
      else if (id === T.WATER) same = t => t === -1 || t === T.WATER || t === T.BRIDGE;
      else if (id === T.WALL) same = t => t === -1 || t === T.WALL || t === T.BLOCK;
      else same = t => t === -1 || t === id;
      let mk = 0;
      nb.forEach((t, k) => { if (!same(t)) mk |= 1 << k; });
      m.mask[i] = mk;
    }
    m.objGrid = {};
    m.objects.forEach(o => { for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) m.objGrid[key(o.x + i, o.y + j)] = o; });
  }

  // NPC 생성
  function makeNPC(d) {
    return Object.assign({}, d, { home: [d.x, d.y], px: d.x * TILE, py: d.y * TILE, moving: false, t: 0, phase: 0, wanderT: 1 + Math.random() * 3 });
  }
  TT.npcs = TT.NPCS.map(makeNPC);
  // NPC/사물 자리에 나무가 생기지 않도록 정리
  Object.values(TT.maps).forEach(m => {
    const clear = (x, y) => { const t = TT.getTile(m, x, y); if (t === T.TREE || t === T.PINE || t === T.BUSH || t === T.FLOWER) TT.setTile(m, x, y, T.GRASS); };
    TT.npcs.filter(n => n.map === m.id).forEach(n => { clear(n.x, n.y); if (n.place) { const [px, py] = [31, 36]; clear(px, py); } });
    m.objects.forEach(o => { for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) clear(o.x + i, o.y + j); });
    prepareMap(m);
  });
  TT.findNPC = id => TT.npcs.find(n => n.id === id);
  function placeNPCs() {
    TT.npcs.forEach(n => {
      if (n.place) {
        const [x, y, d] = n.place();
        if (!n.moving && (n.x !== x || n.y !== y)) { n.x = x; n.y = y; n.home = [x, y]; n.px = x * TILE; n.py = y * TILE; n.dir = d; }
      }
    });
  }
  TT.placeNPCs = placeNPCs;

  // ---------------------------------------------------------------- 플레이어
  TT.player = { x: 21, y: 40, px: 21 * TILE, py: 40 * TILE, dir: 3, moving: false, t: 0, phase: 0, fx: 0, fy: 0 };
  const P = TT.player;
  function setPlayer(x, y, dir) {
    P.x = x; P.y = y; P.px = x * TILE; P.py = y * TILE; P.dir = dir == null ? P.dir : dir; P.moving = false; P.t = 0;
  }

  let currentZone = null;
  function loadMap(id, x, y, dir) {
    TT.map = TT.maps[id];
    setPlayer(x, y, dir);
    placeNPCs();
    currentZone = null;
    checkZone(true);
    if (TT.started) TT.music.forMap(id);
  }

  // ---------------------------------------------------------------- 충돌
  function npcAt(m, x, y, except) {
    return TT.npcs.find(n => n !== except && n.map === m.id && ((n.x === x && n.y === y) || (n.moving && n.tx === x && n.ty === y)));
  }
  function blocked(m, x, y, self) {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
    if (TT.SOLID.has(m.tiles[y * m.w + x])) return true;
    const o = m.objGrid[key(x, y)];
    if (o && o.solid) return true;
    if (npcAt(m, x, y, self)) return true;
    if (self !== P && ((P.x === x && P.y === y) || (P.moving && P.tx === x && P.ty === y))) return true;
    return false;
  }
  TT.blocked = (x, y) => blocked(TT.map, x, y, P);

  // ---------------------------------------------------------------- 입력
  const held = [];
  const KEYMAP = { ArrowUp: 3, KeyW: 3, ArrowDown: 0, KeyS: 0, ArrowLeft: 1, KeyA: 1, ArrowRight: 2, KeyD: 2 };
  const CONFIRM = new Set(['Space', 'Enter', 'NumpadEnter', 'KeyE', 'KeyZ']);
  let running = false;
  TT.input = { held };

  let tapDir = null; // 아주 짧게 누른 키도 한 칸은 움직이도록
  function pressDir(d) { const i = held.indexOf(d); if (i >= 0) held.splice(i, 1); held.push(d); tapDir = d; }
  function releaseDir(d) { const i = held.indexOf(d); if (i >= 0) held.splice(i, 1); }

  function onConfirm() {
    TT.sfx.unlock();
    if (!TT.started) return;
    if (ui.narrOpen()) return ui.narrAdvance();
    if (ui.modalOpen()) {
      const b = document.querySelector('#modal .primary:not([disabled])');
      if (b && b.offsetParent !== null) b.click();
      return;
    }
    if (ui.dialogOpen()) { if (ui.choiceActive()) ui.pickChoice(); else ui.advance(); return; }
    if (!TT.busy) interact();
  }
  TT.confirm = onConfirm;

  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    const d = KEYMAP[e.code];
    if (d != null) {
      e.preventDefault();
      if (ui.choiceActive() && (d === 0 || d === 3)) { if (!e.repeat) ui.moveChoice(d === 0 ? 1 : -1); return; }
      pressDir(d);
      return;
    }
    if (e.key === 'Shift') running = true;
    if (CONFIRM.has(e.code)) { e.preventDefault(); if (!e.repeat) onConfirm(); return; }
    if (/^Digit[1-4]$/.test(e.code)) {
      const n = e.code.slice(5);
      if (ui.modalOpen()) { const b = document.querySelector(`#modal [data-key="${n}"]:not([disabled])`); if (b) b.click(); }
      else if (ui.choiceActive()) { const bs = document.querySelectorAll('#dlg-choices .choice'); if (bs[n - 1]) bs[n - 1].click(); }
      return;
    }
    if (e.code === 'Escape') { if (ui.modalOpen() && document.querySelector('#modal.closable')) ui.closeModal(); return; }
    if (!TT.started || TT.busy || ui.modalOpen() || ui.dialogOpen()) return;
    if (e.code === 'KeyB') ui.openDex();
    if (e.code === 'KeyM') ui.openMap();
  });
  window.addEventListener('keyup', e => {
    const d = KEYMAP[e.code];
    if (d != null) releaseDir(d);
    if (e.key === 'Shift') running = false;
  });
  window.addEventListener('blur', () => { held.length = 0; tapDir = null; running = false; });

  // 터치 조작
  const touchEl = document.getElementById('touch');
  if (('ontouchstart' in window) || navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches) touchEl.dataset.enabled = '1';
  touchEl.querySelectorAll('[data-dir]').forEach(b => {
    const d = +b.dataset.dir;
    const down = e => { e.preventDefault(); TT.sfx.unlock(); pressDir(d); b.classList.add('on'); };
    const up = e => { e.preventDefault(); releaseDir(d); b.classList.remove('on'); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
  });
  document.getElementById('btn-a').addEventListener('pointerdown', e => { e.preventDefault(); onConfirm(); });
  document.getElementById('btn-dex').onclick = () => { if (!TT.busy) ui.openDex(); };
  document.getElementById('btn-map').onclick = () => { if (!TT.busy) ui.openMap(); };
  document.getElementById('btn-menu').onclick = () => { if (!TT.busy) ui.openMenu(); };
  document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal' && e.target.classList.contains('closable')) ui.closeModal(); });

  // ---------------------------------------------------------------- 스크립트 실행
  TT.run = async function (fn) {
    if (TT.busy) return;
    TT.busy = true;
    held.length = 0;
    try { await fn(); }
    catch (err) { console.error(err); }
    finally {
      ui.closeDialog();
      TT.busy = false;
      held.length = 0;
      placeNPCs();
      ui.updateHUD();
      TT.save();
    }
  };

  function interact() {
    const [dx, dy] = DIRV[P.dir];
    const tx = P.x + dx, ty = P.y + dy;
    const m = TT.map;
    const npc = npcAt(m, tx, ty);
    if (npc && !npc.moving) {
      npc.dir = [3, 2, 1, 0][P.dir];
      TT.run(async () => {
        await npc.talk(npc);
        TT.state.talked[npc.id] = 1;
      });
      return;
    }
    const o = m.objGrid[key(tx, ty)];
    if (o && TT.story.objects[o.id]) { TT.run(TT.story.objects[o.id]); return; }
    const door = m.doors[key(tx, ty)];
    if (door) { TT.run(() => TT.story.door(door)); return; }
  }

  // ---------------------------------------------------------------- 맵 이동 (페이드)
  const fadeEl = document.getElementById('fade');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function fadeTo(fn) {
    fadeEl.classList.add('on');
    await wait(280);
    fn();
    await wait(60);
    fadeEl.classList.remove('on');
    await wait(200);
  }
  TT.enterMap = async function (id) {
    TT.sfx.door();
    const m = TT.maps[id];
    await fadeTo(() => loadMap(id, m.spawn.x, m.spawn.y, m.spawn.dir));
    ui.banner('📍 ' + m.name);
    TT.save();
  };
  TT.warp = async function (to) {
    TT.sfx.door();
    await fadeTo(() => loadMap(to.map, to.x, to.y, to.dir));
    TT.save();
  };
  TT.doorOfMap = function (mapId) {
    const doorId = { palace_in: 'palace', jiphyeon_in: 'jiphyeon', workshop_in: 'workshop' }[mapId];
    if (!doorId) return null;
    const h = TT.maps.hanyang;
    for (const k in h.doors) if (h.doors[k] === doorId) { const [x, y] = k.split(',').map(Number); return { x, y }; }
    return null;
  };

  function checkZone(force) {
    const m = TT.map;
    if (!m.zones || !m.zones.length) return;
    const z = m.zones.find(z => P.x >= z.x && P.x < z.x + z.w && P.y >= z.y && P.y < z.y + z.h);
    if (z && z !== currentZone) { if (!force) ui.banner(z.name); }
    currentZone = z || currentZone;
  }

  // 목표 위치 (현재 맵 기준 타일)
  TT.objectiveTile = function (mapId) {
    const o = TT.story.objective();
    if (!o || !o.map) return null;
    const m = TT.maps[mapId];
    if (o.npcs) {
      if (mapId !== o.map) return firstExit(m);
      let best = null, bd = 1e9;
      o.npcs.forEach(id => { const n = TT.findNPC(id); const d = Math.abs(n.x - P.x) + Math.abs(n.y - P.y); if (d < bd) { bd = d; best = n; } });
      return best ? { x: best.x, y: best.y, npc: true } : null;
    }
    if (mapId === o.map) { const n = TT.findNPC(o.npc); return { x: n.x, y: n.y, npc: true }; }
    if (mapId === 'hanyang') return TT.doorOfMap(o.map);
    return firstExit(m);
  };
  function firstExit(m) {
    const ks = Object.keys(m.exits);
    if (!ks.length) return null;
    const [x, y] = ks[Math.floor(ks.length / 2)].split(',').map(Number);
    return { x, y };
  }

  // ---------------------------------------------------------------- 업데이트
  let bumpCD = 0, saveCD = 0;
  function update(dt) {
    const m = TT.map;
    const canMove = TT.started && !TT.busy && !ui.modalOpen() && !ui.dialogOpen() && !ui.narrOpen();
    const speed = running ? 7.5 : 4.6;
    bumpCD -= dt;
    if (P.moving) {
      P.t += dt * speed;
      P.phase += dt * speed * 0.5;
      if (P.t >= 1) {
        P.x = P.tx; P.y = P.ty; P.moving = false; P.t = 0;
        onStep();
      }
    }
    if (!canMove) tapDir = null;
    if (!P.moving && canMove && (held.length || tapDir != null)) {
      const d = held.length ? held[held.length - 1] : tapDir;
      tapDir = null;
      P.dir = d;
      const nx = P.x + DIRV[d][0], ny = P.y + DIRV[d][1];
      if (!blocked(m, nx, ny, P)) {
        P.moving = true; P.tx = nx; P.ty = ny; P.t = 0; P.fx = P.x; P.fy = P.y;
      } else {
        const door = m.doors[key(nx, ny)];
        if (door) { TT.run(() => TT.story.door(door)); }
        else if (bumpCD <= 0) { TT.sfx.bump(); bumpCD = 0.35; }
      }
    }
    if (P.moving) {
      const e = Math.min(P.t, 1);
      P.px = (P.fx + (P.tx - P.fx) * e) * TILE;
      P.py = (P.fy + (P.ty - P.fy) * e) * TILE;
    } else { P.px = P.x * TILE; P.py = P.y * TILE; if (!held.length || !canMove) P.phase = 0; }

    // NPC 배회
    TT.npcs.forEach(n => {
      if (n.map !== m.id) return;
      if (n.moving) {
        n.t += dt * 2.4; n.phase += dt * 1.2;
        if (n.t >= 1) { n.x = n.tx; n.y = n.ty; n.moving = false; n.t = 0; n.phase = 0; }
        const e = Math.min(n.t, 1);
        n.px = (n.x + (n.tx - n.x) * (n.moving ? e : 0)) * TILE;
        n.py = (n.y + (n.ty - n.y) * (n.moving ? e : 0)) * TILE;
        if (!n.moving) { n.px = n.x * TILE; n.py = n.y * TILE; }
        return;
      }
      if (!n.wander || TT.busy) return;
      n.wanderT -= dt;
      if (n.wanderT > 0) return;
      n.wanderT = 1.2 + Math.random() * 2.8;
      const d = (Math.random() * 4) | 0;
      const nx = n.x + DIRV[d][0], ny = n.y + DIRV[d][1];
      n.dir = d;
      if (Math.abs(nx - n.home[0]) > n.wander || Math.abs(ny - n.home[1]) > n.wander) return;
      if (blocked(m, nx, ny, n) || m.doors[key(nx, ny)] || m.exits[key(nx, ny)]) return;
      n.moving = true; n.tx = nx; n.ty = ny; n.t = 0;
    });

    saveCD -= dt;
    if (saveCD <= 0 && TT.started && !TT.busy) { saveCD = 3; TT.save(); }
  }

  function onStep() {
    const m = TT.map;
    const ex = m.exits[key(P.x, P.y)];
    if (ex) { TT.run(() => TT.warp(ex)); return; }
    checkZone(false);
  }

  // ---------------------------------------------------------------- 렌더
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.floor(innerWidth * dpr); H = Math.floor(innerHeight * dpr);
    canvas.width = W; canvas.height = H;
    const css = Math.max(38, Math.min(innerWidth / 15, innerHeight / 9.5, 72));
    tileDev = Math.round(css * dpr);
    sc = tileDev / TILE;
    tileCache = {};
    Object.values(TT.maps).forEach(m => m.buildings.forEach(b => (b._img = null)));
  }
  window.addEventListener('resize', resize);
  resize();

  function tileImg(id, v, mk) {
    const k = id * 1000 + v * 100 + mk;
    let c = tileCache[k];
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = tileDev;
      const g = c.getContext('2d'); g.scale(sc, sc);
      TT.drawTile(g, id, v, mk);
      tileCache[k] = c;
    }
    return c;
  }
  function buildingImg(b) {
    if (!b._img) {
      const c = document.createElement('canvas');
      c.width = b.w * tileDev; c.height = b.h * tileDev;
      const g = c.getContext('2d'); g.scale(sc, sc);
      TT.drawBuilding(g, b);
      b._img = c;
    }
    return b._img;
  }

  function label(c, text, x, y, size) {
    c.font = `${size || 11}px Jua, "Malgun Gothic", sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(text).width + 12, h = (size || 11) + 8;
    TT.draw.rrect(c, '#5b3a1e', x - w / 2 - 1.5, y - h / 2 - 1.5, w + 3, h + 3, 7);
    TT.draw.rrect(c, '#fff6e2', x - w / 2, y - h / 2, w, h, 6);
    c.fillStyle = '#4a2c12'; c.fillText(text, x, y + 0.5);
  }

  let camX = 0, camY = 0, clock = 0;
  function render() {
    const m = TT.map;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = m.bg || '#222'; ctx.fillRect(0, 0, W, H);
    const vw = W / sc, vh = H / sc, mw = m.w * TILE, mh = m.h * TILE;
    let tx = P.px + 16 - vw / 2, ty = P.py + 8 - vh / 2;
    tx = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(tx, mw - vw));
    ty = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(ty, mh - vh));
    camX = tx; camY = ty;
    const ox = Math.round(camX * sc), oy = Math.round(camY * sc);

    const x0 = Math.max(0, Math.floor(camX / TILE)), x1 = Math.min(m.w - 1, Math.floor((camX + vw) / TILE));
    const y0 = Math.max(0, Math.floor(camY / TILE)), y1 = Math.min(m.h - 1, Math.floor((camY + vh) / TILE));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * m.w + x;
      ctx.drawImage(tileImg(m.tiles[i], m.vari[i], m.mask[i]), x * tileDev - ox, y * tileDev - oy);
    }
    m.buildings.forEach(b => {
      if (b.x > x1 + 1 || b.x + b.w < x0 - 1 || b.y > y1 + 1 || b.y + b.h < y0 - 1) return;
      ctx.drawImage(buildingImg(b), b.x * tileDev - ox, b.y * tileDev - oy);
    });

    ctx.setTransform(sc, 0, 0, sc, -ox, -oy);
    // 물결 반짝임
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (m.tiles[y * m.w + x] !== T.WATER) continue;
      const ph = (clock * 1.3 + TT.hash(x, y) % 100 / 15) % 3;
      if (ph < 0.6) { ctx.fillStyle = `rgba(255,255,255,${0.7 - ph})`; ctx.fillRect(x * TILE + 8 + (TT.hash(y, x) % 14), y * TILE + 10 + ph * 6, 4, 1.5); }
    }
    // 이름표 (건물/장소)
    m.buildings.forEach(b => { if (b.label) label(ctx, b.label, (b.x + b.w / 2) * TILE, b.y * TILE + 4, 11); });
    m.labels.forEach(l => label(ctx, l.text, l.x * TILE, l.y * TILE, 10));

    // 엔티티 y정렬
    const ents = [];
    m.objects.forEach(o => { if (o.x <= x1 + 1 && o.x + o.w >= x0 - 1 && o.y <= y1 + 2 && o.y + o.h >= y0 - 1) ents.push({ y: (o.y + o.h) * TILE - (o.solid ? 0 : 1000), draw: () => TT.drawObject(ctx, o, clock) }); });
    TT.npcs.forEach(n => { if (n.map === m.id) ents.push({ y: n.py + TILE, draw: () => TT.drawChar(ctx, n.px + 16, n.py + 30, n.look, n.dir, n.phase, n.moving) }); });
    ents.push({ y: P.py + TILE + 0.5, draw: () => TT.drawChar(ctx, P.px + 16, P.py + 30, TT.LOOKS.player, P.dir, P.phase, P.moving) });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());

    // ! 표시
    const bounce = Math.sin(clock * 5) * 2;
    TT.npcs.forEach(n => {
      if (n.map !== m.id || !n.important || !n.important()) return;
      const bx = n.px + 16, by = n.py - 18 + bounce;
      TT.draw.rrect(ctx, '#5b3a1e', bx - 7, by - 9, 14, 16, 5);
      TT.draw.rrect(ctx, '#ffd23f', bx - 5.5, by - 7.5, 11, 13, 4);
      ctx.fillStyle = '#5b3a1e'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', bx, by - 0.5);
    });

    // 목표 화살표
    const tgt = TT.started && TT.objectiveTile(m.id);
    if (tgt) {
      const wx = tgt.x * TILE + 16, wy = tgt.y * TILE + (tgt.npc ? -34 : -6) + Math.sin(clock * 4) * 3;
      const onScreen = wx > camX + 10 && wx < camX + vw - 10 && wy > camY + 10 && wy < camY + vh - 10;
      if (onScreen) {
        if (!tgt.npc || !(TT.findNPC && TT.npcs.some(n => n.map === m.id && n.x === tgt.x && n.y === tgt.y && n.important && n.important()))) drawArrow(ctx, wx, wy - (tgt.npc ? 8 : 0), Math.PI / 2, 1);
      } else {
        const cx = camX + vw / 2, cy = camY + vh / 2;
        const ang = Math.atan2(wy - cy, wx - cx);
        const mx = vw / 2 - 26, my = vh / 2 - 30;
        const k = Math.min(Math.abs(mx / Math.cos(ang)), Math.abs(my / Math.sin(ang)));
        drawArrow(ctx, cx + Math.cos(ang) * k, cy + Math.sin(ang) * k, ang, 1.15);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function drawArrow(c, x, y, ang, s) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -9); c.lineTo(-3, 0); c.lineTo(-6, 9); c.closePath();
    c.fillStyle = '#ffd23f'; c.strokeStyle = '#5b3a1e'; c.lineWidth = 2.5; c.stroke(); c.fill();
    c.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; clock += dt;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- 시작 화면
  const titleEl = document.getElementById('title-screen');
  const saved = TT.loadSave();
  loadMap('hanyang', 21, 40, 3);
  if (saved) document.getElementById('btn-continue').classList.remove('hidden');
  // 브라우저 정책상 첫 클릭/키 입력 뒤에 음악 시작
  const firstGesture = () => {
    window.removeEventListener('pointerdown', firstGesture, true);
    window.removeEventListener('keydown', firstGesture, true);
    if (saved && saved.musicOff) TT.state.musicOff = true;
    if (!TT.started) TT.music.play('title');
  };
  window.addEventListener('pointerdown', firstGesture, true);
  window.addEventListener('keydown', firstGesture, true);

  function showGameUI() {
    titleEl.classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    if (touchEl.dataset.enabled) touchEl.classList.remove('hidden');
  }
  document.getElementById('btn-continue').onclick = () => {
    TT.sfx.unlock(); TT.sfx.select();
    TT.state = Object.assign(TT.newState(), saved);
    const p = TT.state.pos;
    loadMap(TT.maps[p.map] ? p.map : 'hanyang', p.x, p.y, p.dir);
    TT.started = true;
    TT.music.forMap(TT.map.id);
    showGameUI();
    ui.updateHUD();
    ui.banner('📍 ' + (TT.map.id === 'hanyang' ? (currentZone ? currentZone.name : '한양') : TT.map.name));
    if (TT.state.step === 0) TT.run(TT.story.intro);
  };
  document.getElementById('btn-new').onclick = async () => {
    TT.sfx.unlock(); TT.sfx.select();
    if (saved) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
    TT.state = TT.newState();
    titleEl.classList.add('hidden');
    TT.state.name = await ui.askName();
    TT.sfx.warp();
    loadMap('hanyang', 21, 40, 3);
    TT.started = true;
    TT.music.forMap('hanyang');
    showGameUI();
    ui.updateHUD();
    TT.save();
    TT.run(TT.story.intro);
  };

  // ---------------------------------------------------------------- 디버그/테스트 도우미
  TT.debug = {
    where: () => ({ map: TT.map.id, x: P.x, y: P.y, dir: P.dir, busy: TT.busy }),
    path(tx, ty) {
      const m = TT.map, start = key(P.x, P.y), goal = key(tx, ty);
      const prev = { [start]: null }, q = [[P.x, P.y]];
      while (q.length) {
        const [x, y] = q.shift();
        if (key(x, y) === goal) break;
        for (let d = 0; d < 4; d++) {
          const nx = x + DIRV[d][0], ny = y + DIRV[d][1], k = key(nx, ny);
          if (k in prev) continue;
          if (k !== goal && blocked(m, nx, ny, P)) continue;
          prev[k] = [key(x, y), d]; q.push([nx, ny]);
        }
      }
      if (!(goal in prev)) return null;
      const dirs = []; let k = goal;
      while (prev[k]) { dirs.unshift(prev[k][1]); k = prev[k][0]; }
      return dirs;
    },
    // 실제 키 입력(held)을 흉내 내어 걸어감 → 이동/충돌 코드를 그대로 사용
    async walkTo(tx, ty, opts) {
      const stopAdj = opts && opts.adjacent;
      for (let tries = 0; tries < 400; tries++) {
        if (P.x === tx && P.y === ty) return true;
        if (stopAdj && Math.abs(P.x - tx) + Math.abs(P.y - ty) === 1) return true;
        const dirs = this.path(tx, ty);
        if (!dirs || !dirs.length) return false;
        let d = dirs[0];
        if (stopAdj && dirs.length === 1) { P.dir = d; return true; }
        const mapId = TT.map.id;
        pressDir(d);
        const t0 = performance.now();
        while (!P.moving && !TT.busy && performance.now() - t0 < 1500) await wait(8);
        releaseDir(d);
        if (TT.busy) return 'event';
        while (P.moving) await wait(16);
        if (TT.map.id !== mapId) return true;
      }
      return false;
    },
    face(d) { P.dir = d; },
    pressDir, releaseDir,
  };

  requestAnimationFrame(frame);
})();
