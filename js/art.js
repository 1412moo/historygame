// 모든 그래픽은 캔버스 도형으로 직접 그린 오리지널 아트입니다 (외부 리소스 없음).
// 좌표 단위: 타일 1칸 = 32 "월드 단위"
(function () {
  const TT = (window.TT = window.TT || {});
  const T = (TT.T = {
    GRASS: 0, ROAD: 1, PLAZA: 2, WATER: 3, BRIDGE: 4, TREE: 5, WALL: 6, FENCE: 7, FLOWER: 8,
    BLOCK: 9, FLOOR: 10, IWALL: 11, MAT: 12, EXIT: 13, SAND: 14, PINE: 15, BUSH: 16,
  });
  TT.SOLID = new Set([T.WATER, T.TREE, T.WALL, T.FENCE, T.BLOCK, T.IWALL, T.PINE, T.BUSH]);

  function rng(seed) {
    let s = (Math.imul(seed | 0, 2654435761) >>> 0) || 7;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  TT.rng = rng;
  TT.hash = (x, y) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0);

  const R = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const circ = (c, col, x, y, r) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const ell = (c, col, x, y, rx, ry) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  function rrect(c, col, x, y, w, h, r) {
    c.fillStyle = col; c.beginPath();
    r = Math.min(r, w / 2, h / 2);
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill();
  }
  TT.draw = { R, circ, ell, rrect };

  // ---------------------------------------------------------------- 타일
  function grass(c, v) {
    R(c, '#8fd163', 0, 0, 32, 32);
    const r = rng(v * 31 + 11);
    for (let i = 0; i < 4; i++) {
      const x = (r() * 26) | 0, y = (r() * 24) | 0;
      R(c, '#7bbf50', x, y + 2, 2, 4); R(c, '#7bbf50', x + 3, y, 2, 6); R(c, '#7bbf50', x + 6, y + 3, 2, 3);
    }
    for (let i = 0; i < 2; i++) R(c, '#a8e07f', (r() * 28) | 0, (r() * 28) | 0, 3, 2);
  }
  function sand(c, v) {
    R(c, '#e3cb9c', 0, 0, 32, 32);
    const r = rng(v * 17 + 5);
    for (let i = 0; i < 6; i++) R(c, i % 2 ? '#cfb380' : '#efdcb6', (r() * 30) | 0, (r() * 30) | 0, 2, 2);
  }
  function floor(c, v) {
    R(c, '#cf9c63', 0, 0, 32, 32);
    const r = rng(v * 13 + 3);
    for (let x = 0; x < 32; x += 8) { R(c, '#b8864f', x, 0, 1, 32); R(c, '#b8864f', x, (r() * 30) | 0, 8, 1); }
    R(c, '#dcae78', 2 + ((r() * 24) | 0), 4 + ((r() * 20) | 0), 3, 1);
  }

  TT.drawTile = function (c, id, v, mask) {
    switch (id) {
      case T.GRASS: grass(c, v); break;
      case T.FLOWER: {
        grass(c, v);
        const r = rng(v * 7 + 50);
        const cols = ['#ff8fb1', '#ffe066', '#ffffff', '#c99bff', '#ff9f5a'];
        for (let i = 0; i < 3; i++) {
          const x = 5 + r() * 22, y = 5 + r() * 22, col = cols[(r() * cols.length) | 0];
          circ(c, col, x - 2, y, 1.8); circ(c, col, x + 2, y, 1.8); circ(c, col, x, y - 2, 1.8); circ(c, col, x, y + 2, 1.8);
          circ(c, '#f7c948', x, y, 1.3);
        }
        break;
      }
      case T.ROAD: {
        R(c, '#e5c999', 0, 0, 32, 32);
        const r = rng(v * 19 + 2);
        for (let i = 0; i < 5; i++) R(c, i % 2 ? '#d2b07c' : '#efdab3', (r() * 30) | 0, (r() * 30) | 0, 2 + (i % 2), 2);
        const e = '#cda86f';
        if (mask & 1) R(c, e, 0, 0, 32, 2);
        if (mask & 2) R(c, e, 30, 0, 2, 32);
        if (mask & 4) R(c, e, 0, 30, 32, 2);
        if (mask & 8) R(c, e, 0, 0, 2, 32);
        break;
      }
      case T.PLAZA: case T.BLOCK: {
        R(c, '#ddd4c1', 0, 0, 32, 32);
        const off = v % 2 ? 8 : 0;
        R(c, '#c4b9a2', 0, 0, 32, 1); R(c, '#c4b9a2', 0, 16, 32, 1);
        for (let x = off; x < 32; x += 16) R(c, '#c4b9a2', x, 0, 1, 16);
        for (let x = (off + 8) % 16; x < 32; x += 16) R(c, '#c4b9a2', x, 16, 1, 16);
        R(c, '#ebe4d6', 3 + (v % 3) * 8, 3, 4, 2);
        break;
      }
      case T.WATER: {
        R(c, '#4ea4e2', 0, 0, 32, 32);
        const r = rng(v * 23 + 3);
        c.strokeStyle = '#87cdf5'; c.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          const x = 4 + r() * 18, y = 8 + r() * 16;
          c.beginPath(); c.arc(x, y, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
          c.beginPath(); c.arc(x + 7, y, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
        }
        if (mask & 1) { R(c, '#7cb85a', 0, 0, 32, 3); R(c, '#d6f1ff', 0, 3, 32, 2); }
        if (mask & 4) { R(c, '#3a8bc6', 0, 27, 32, 2); R(c, '#7cb85a', 0, 29, 32, 3); }
        break;
      }
      case T.BRIDGE: {
        R(c, '#c08a55', 0, 0, 32, 32);
        for (let y = 0; y < 32; y += 6) R(c, '#9a6a3d', 0, y, 32, 1);
        if (mask & 8) { R(c, '#7a4c26', 0, 0, 4, 32); R(c, '#a06a3a', 0, 0, 4, 2); }
        if (mask & 2) { R(c, '#7a4c26', 28, 0, 4, 32); R(c, '#a06a3a', 28, 0, 4, 2); }
        break;
      }
      case T.TREE: {
        grass(c, v);
        ell(c, 'rgba(0,0,0,.16)', 16, 28, 11, 3);
        R(c, '#7a4f2a', 14, 19, 5, 10);
        circ(c, '#3a8f40', 16, 13, 11); circ(c, '#3a8f40', 9, 17, 7); circ(c, '#3a8f40', 23, 17, 7);
        circ(c, '#4fae52', 13, 10, 6); circ(c, '#4fae52', 21, 13, 4); circ(c, '#72c86d', 11, 8, 2.5);
        break;
      }
      case T.PINE: {
        grass(c, v);
        ell(c, 'rgba(0,0,0,.16)', 16, 29, 11, 3);
        c.fillStyle = '#9a5534'; c.beginPath();
        c.moveTo(13, 30); c.lineTo(19, 30); c.lineTo(19, 20); c.lineTo(21, 12); c.lineTo(17, 12); c.lineTo(15, 20); c.closePath(); c.fill();
        ell(c, '#2e6e45', 10, 12, 9, 5); ell(c, '#2e6e45', 22, 8, 9, 5); ell(c, '#2e6e45', 17, 18, 12, 5);
        ell(c, '#418c5c', 9, 11, 6, 3); ell(c, '#418c5c', 21, 7, 6, 3); ell(c, '#418c5c', 15, 17, 8, 3);
        break;
      }
      case T.BUSH: {
        grass(c, v);
        ell(c, 'rgba(0,0,0,.15)', 16, 28, 12, 3);
        ell(c, '#3f9a46', 16, 19, 13, 10); ell(c, '#55b45a', 12, 16, 6, 4); circ(c, '#ff7c7c', 21, 21, 1.6); circ(c, '#ff7c7c', 10, 22, 1.6);
        break;
      }
      case T.WALL: {
        R(c, '#a49e94', 0, 0, 32, 32);
        for (let row = 0; row < 4; row++) {
          const y = row * 8;
          R(c, '#888278', 0, y, 32, 1);
          for (let x = row % 2 ? 0 : 8; x < 32; x += 16) R(c, '#888278', x, y, 1, 8);
          R(c, '#b7b1a7', (row * 11) % 26 + 2, y + 2, 4, 1);
        }
        if (mask & 1) {
          R(c, '#3e4552', 0, 0, 32, 9);
          for (let x = 1; x < 32; x += 4) R(c, '#56606f', x, 0, 2, 8);
          R(c, '#2a2f39', 0, 9, 32, 2);
        }
        break;
      }
      case T.FENCE: {
        grass(c, v);
        R(c, '#8b5a2e', 3, 8, 4, 20); R(c, '#8b5a2e', 25, 8, 4, 20);
        R(c, '#a8713d', 3, 6, 4, 3); R(c, '#a8713d', 25, 6, 4, 3);
        R(c, '#b07a44', 0, 12, 32, 3); R(c, '#b07a44', 0, 20, 32, 3);
        R(c, '#7a4a25', 0, 15, 32, 1); R(c, '#7a4a25', 0, 23, 32, 1);
        break;
      }
      case T.FLOOR: floor(c, v); break;
      case T.IWALL: {
        R(c, '#f2e7cd', 0, 0, 32, 32);
        R(c, '#cdb98e', 10, 3, 1, 26); R(c, '#cdb98e', 21, 3, 1, 26);
        R(c, '#cdb98e', 0, 12, 32, 1); R(c, '#cdb98e', 0, 21, 32, 1);
        R(c, '#7b4a25', 0, 0, 32, 3); R(c, '#7b4a25', 0, 29, 32, 3);
        if (v % 2 === 0) R(c, '#8a5730', 0, 0, 4, 32);
        break;
      }
      case T.MAT: {
        R(c, '#b5332e', 0, 0, 32, 32);
        c.fillStyle = '#d9a441';
        c.beginPath(); c.moveTo(16, 11); c.lineTo(21, 16); c.lineTo(16, 21); c.lineTo(11, 16); c.closePath(); c.fill();
        if (mask & 8) R(c, '#e0b44a', 0, 0, 3, 32);
        if (mask & 2) R(c, '#e0b44a', 29, 0, 3, 32);
        break;
      }
      case T.EXIT: {
        floor(c, v);
        const g = c.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(1, 'rgba(255,240,200,.75)');
        c.fillStyle = g; c.fillRect(0, 0, 32, 32);
        c.fillStyle = 'rgba(120,70,30,.55)';
        c.beginPath(); c.moveTo(10, 14); c.lineTo(22, 14); c.lineTo(16, 22); c.closePath(); c.fill();
        break;
      }
      case T.SAND: sand(c, v); break;
      default: R(c, '#f0f', 0, 0, 32, 32);
    }
  };

  // ---------------------------------------------------------------- 건물
  function giwaRoof(c, W, bottom, top, col) {
    col = col || '#4a5263';
    const dark = '#323845', light = '#5d6779';
    const path = () => {
      c.beginPath();
      c.moveTo(0, bottom - 14);
      c.quadraticCurveTo(W * 0.12, bottom + 2, W * 0.28, bottom);
      c.lineTo(W * 0.72, bottom);
      c.quadraticCurveTo(W * 0.88, bottom + 2, W, bottom - 14);
      c.lineTo(W - 16, top + 6); c.lineTo(16, top + 6); c.closePath();
    };
    path(); c.fillStyle = col; c.fill();
    c.save(); path(); c.clip();
    c.fillStyle = light; for (let x = 3; x < W; x += 6) c.fillRect(x, top, 2, bottom);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, bottom - 5, W, 6);
    c.restore();
    c.strokeStyle = dark; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(0, bottom - 14); c.quadraticCurveTo(W * 0.12, bottom + 2, W * 0.28, bottom);
    c.lineTo(W * 0.72, bottom); c.quadraticCurveTo(W * 0.88, bottom + 2, W, bottom - 14); c.stroke();
    R(c, dark, 12, top + 1, W - 24, 7);
    R(c, '#ece6d8', 14, top + 5, W - 28, 1.5);
    c.fillStyle = dark;
    c.beginPath(); c.moveTo(12, top + 8); c.lineTo(6, top - 1); c.lineTo(14, top + 1); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(W - 12, top + 8); c.lineTo(W - 6, top - 1); c.lineTo(W - 14, top + 1); c.closePath(); c.fill();
  }
  function chogaRoof(c, W, bottom, top) {
    const path = () => { c.beginPath(); c.moveTo(0, bottom); c.bezierCurveTo(2, top - 4, W - 2, top - 4, W, bottom); c.closePath(); };
    path(); c.fillStyle = '#d8b05a'; c.fill();
    c.save(); path(); c.clip();
    c.strokeStyle = '#b48a3a'; c.lineWidth = 1.5;
    for (let k = 1; k <= 3; k++) {
      const yy = top + (bottom - top) * k / 4;
      c.beginPath(); c.moveTo(0, yy + 6); c.quadraticCurveTo(W / 2, yy - 8, W, yy + 6); c.stroke();
    }
    for (let x = 6; x < W; x += 10) { c.beginPath(); c.moveTo(x, bottom); c.lineTo(W / 2 + (x - W / 2) * 0.6, top); c.stroke(); }
    ell(c, 'rgba(255,240,180,.35)', W * 0.4, top + (bottom - top) * 0.35, W * 0.18, 4);
    c.restore();
    R(c, '#a77f34', 0, bottom - 3, W, 3);
    for (let x = 2; x < W; x += 5) R(c, '#a77f34', x, bottom, 2, 2);
  }
  function walls(c, W, H, o) {
    const baseH = 6;
    const wallTop = o.wallTop;
    R(c, '#9e978b', 2, H - baseH, W - 4, baseH); R(c, '#b8b1a5', 2, H - baseH, W - 4, 2);
    R(c, o.wall, 6, wallTop, W - 12, H - baseH - wallTop);
    const n = Math.max(2, Math.round((W - 12) / 30));
    const step = (W - 17) / n;
    const doorXs = o.doorXs || [];
    for (let i = 0; i < n; i++) {
      const bx = 6 + i * step + 5, bw = step - 5, cx = bx + bw / 2;
      if (doorXs.some(d => Math.abs(cx - d) < step * 0.55)) continue;
      const wy = wallTop + 7, wh = Math.min(16, H - baseH - wallTop - 12);
      if (wh < 6) continue;
      R(c, '#7b4a25', bx + 2, wy - 1, bw - 4, wh + 2);
      R(c, '#f8f1de', bx + 3, wy, bw - 6, wh);
      c.fillStyle = '#b89a6a';
      for (let gx = bx + 3 + 4; gx < bx + bw - 4; gx += 4) c.fillRect(gx, wy, 0.8, wh);
      for (let gy = wy + 4; gy < wy + wh; gy += 4) c.fillRect(bx + 3, gy, bw - 6, 0.8);
    }
    for (let i = 0; i <= n; i++) R(c, o.pillar, 6 + i * step, wallTop, 5, H - baseH - wallTop);
    doorXs.forEach(dx => {
      const dw = 22, dh = Math.min(26, H - baseH - wallTop - 2);
      R(c, '#5c3317', dx - dw / 2 - 2, H - baseH - dh - 2, dw + 4, dh + 2);
      R(c, '#9b5f2d', dx - dw / 2, H - baseH - dh, dw / 2 - 1, dh);
      R(c, '#9b5f2d', dx + 1, H - baseH - dh, dw / 2 - 1, dh);
      R(c, '#b9773d', dx - dw / 2 + 2, H - baseH - dh + 3, dw / 2 - 5, 2);
      R(c, '#b9773d', dx + 3, H - baseH - dh + 3, dw / 2 - 5, 2);
      circ(c, '#e8c14a', dx - 3, H - baseH - dh / 2, 1.3); circ(c, '#e8c14a', dx + 3, H - baseH - dh / 2, 1.3);
    });
    if (o.dancheong) {
      R(c, '#2f8f7b', 4, wallTop - 1, W - 8, 5);
      for (let x = 8; x < W - 6; x += 8) circ(c, '#d94a3a', x, wallTop + 1.5, 1.5);
    }
  }
  function gear(c, x, y, r, col) {
    c.fillStyle = col;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.save(); c.translate(x + Math.cos(a) * r, y + Math.sin(a) * r); c.rotate(a); c.fillRect(-2, -2, 4, 4); c.restore();
    }
    circ(c, col, x, y, r); circ(c, '#00000033', x, y, r * 0.4);
  }
  function hanjaPlaque(c, x, y, w, h, text) {
    R(c, '#2b2622', x - 1, y - 1, w + 2, h + 2); R(c, '#1f3d5c', x, y, w, h);
    c.fillStyle = '#f1d47a'; c.font = `bold ${h * 0.7}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, x + w / 2, y + h / 2 + 1);
  }

  TT.drawBuilding = function (c, b) {
    const W = b.w * 32, H = b.h * 32;
    const doorXs = (b.doorTiles || []).filter(d => d[1] === b.h - 1).map(d => d[0] * 32 + 16);
    let doorPx = null;
    if (doorXs.length) doorPx = [doorXs.reduce((a, v) => a + v, 0) / doorXs.length];
    switch (b.style) {
      case 'giwa': case 'hall': {
        const roofBottom = Math.round(H * 0.5);
        walls(c, W, H, { wall: '#f3ead6', pillar: '#7a4a26', wallTop: roofBottom - 4, doorXs: doorPx, dancheong: b.style === 'hall' });
        giwaRoof(c, W, roofBottom, 2);
        if (b.plaque) hanjaPlaque(c, W / 2 - 22, roofBottom - 2, 44, 11, b.plaque);
        break;
      }
      case 'choga': {
        const roofBottom = Math.round(H * 0.52);
        walls(c, W, H, { wall: '#dcbf92', pillar: '#7a5230', wallTop: roofBottom - 4, doorXs: doorPx });
        chogaRoof(c, W, roofBottom, 4);
        break;
      }
      case 'workshop': {
        const roofBottom = Math.round(H * 0.5);
        walls(c, W, H, { wall: '#c9a46e', pillar: '#6e4523', wallTop: roofBottom - 4, doorXs: doorPx });
        R(c, '#7d6f63', W - 40, 2, 10, 22); R(c, '#5f544a', W - 41, 2, 12, 3);
        chogaRoof(c, W, roofBottom, 8);
        circ(c, 'rgba(220,220,220,.8)', W - 33, -2 + 6, 5); circ(c, 'rgba(220,220,220,.6)', W - 27, 0, 4);
        rrect(c, '#6e4523', 14, roofBottom + 4, 22, 22, 3); gear(c, 25, roofBottom + 15, 6, '#e8c14a');
        break;
      }
      case 'palace': {
        R(c, '#bdb5a6', 0, H - 24, W, 24); R(c, '#a8a092', 0, H - 24, W, 3); R(c, '#cfc8bb', 0, H - 12, W, 2);
        R(c, '#d8d1c4', W / 2 - 20, H - 24, 40, 24);
        for (let y = H - 22; y < H; y += 5) R(c, '#b1a999', W / 2 - 20, y, 40, 1);
        const top = H * 0.48, bot = H - 24;
        R(c, '#f0e3c8', 10, top, W - 20, bot - top);
        for (let x = 10; x <= W - 16; x += (W - 26) / 7) R(c, '#b8382e', x, top, 6, bot - top);
        for (let x = 10; x < W - 20; x += (W - 26) / 7) {
          const ww = (W - 26) / 7 - 6;
          R(c, '#2f7f6b', x + 7, top + 6, ww - 2, bot - top - 10);
          c.fillStyle = '#e8d9b5'; for (let gx = x + 9; gx < x + 6 + ww - 2; gx += 4) c.fillRect(gx, top + 7, 1.5, bot - top - 12);
        }
        R(c, '#2f8f7b', 6, top - 2, W - 12, 6);
        for (let x = 10; x < W - 8; x += 7) circ(c, '#d94a3a', x, top + 1, 1.6);
        // 2층
        R(c, '#f0e3c8', W * 0.2, H * 0.2, W * 0.6, H * 0.14);
        for (let x = W * 0.2; x <= W * 0.8 - 5; x += (W * 0.6 - 5) / 5) R(c, '#b8382e', x, H * 0.2, 5, H * 0.14);
        giwaRoof(c, W, Math.round(H * 0.5), Math.round(H * 0.3));
        c.save(); c.translate(W * 0.14, 0); giwaRoof(c, W * 0.72, Math.round(H * 0.24), 0); c.restore();
        hanjaPlaque(c, W / 2 - 24, H * 0.2 + 2, 48, 12, '勤政殿');
        break;
      }
      case 'gate': {
        const baseTop = Math.round(H * 0.45);
        R(c, '#a7a196', 0, baseTop, W, H - baseTop);
        for (let y = baseTop; y < H; y += 9) {
          R(c, '#8d877c', 0, y, W, 1);
          for (let x = ((y / 9) | 0) % 2 ? 0 : 10; x < W; x += 20) R(c, '#8d877c', x, y, 1, 9);
        }
        const ax = W / 2, aw = 50, aTop = baseTop + 14;
        c.fillStyle = '#2c2a33';
        c.beginPath(); c.moveTo(ax - aw / 2, H); c.lineTo(ax - aw / 2, aTop + aw / 2); c.arc(ax, aTop + aw / 2, aw / 2, Math.PI, 0); c.lineTo(ax + aw / 2, H); c.closePath(); c.fill();
        if (b.closed) {
          R(c, '#8a4b22', ax - aw / 2 + 3, aTop + 10, aw - 6, H - aTop - 10);
          R(c, '#5c3317', ax - 1, aTop + 10, 2, H - aTop - 10);
          for (let y = aTop + 16; y < H - 4; y += 8) for (let x = ax - aw / 2 + 8; x < ax + aw / 2 - 4; x += 8) circ(c, '#d8b04a', x, y, 1.1);
        }
        R(c, '#f0e3c8', W * 0.16, H * 0.24, W * 0.68, baseTop - H * 0.24);
        for (let x = W * 0.16; x <= W * 0.84 - 5; x += (W * 0.68 - 5) / 5) R(c, '#b8382e', x, H * 0.24, 5, baseTop - H * 0.24);
        R(c, '#2f8f7b', W * 0.14, H * 0.24, W * 0.72, 4);
        giwaRoof(c, W, Math.round(H * 0.32), 0);
        if (b.plaque) hanjaPlaque(c, W / 2 - 22, baseTop + 2, 44, 11, b.plaque);
        break;
      }
      case 'stall': {
        R(c, '#8a5a2e', 3, 8, 4, H - 10); R(c, '#8a5a2e', W - 7, 8, 4, H - 10);
        const ct = Math.round(H * 0.56);
        R(c, '#a8713d', 2, ct, W - 4, H - ct - 2); R(c, '#c48a4f', 2, ct, W - 4, 3); R(c, '#7a4a25', 2, H - 4, W - 4, 2);
        const r = rng(b.x * 7 + b.y);
        const gy = ct - 2;
        for (let x = 10; x < W - 8; x += 13) {
          if (b.goods === 'silk') { const col = ['#e86a92', '#6aa8e8', '#f5d04a', '#8ad46a', '#b88ae8'][(r() * 5) | 0]; rrect(c, col, x - 5, gy - 10, 11, 12, 3); R(c, '#ffffff66', x - 5, gy - 7, 11, 2); }
          else if (b.goods === 'tteok') { ell(c, '#f4f1e8', x, gy, 6, 2.5); circ(c, '#ffffff', x - 2, gy - 3, 2.5); circ(c, '#ffb6c8', x + 2, gy - 3, 2.5); circ(c, '#b9e08a', x, gy - 6, 2.5); }
          else if (b.goods === 'pottery') { ell(c, '#6e3f22', x, gy - 5, 5.5, 7); ell(c, '#8a5434', x - 1.5, gy - 7, 2, 3); ell(c, '#4a2a16', x, gy - 12, 3, 1.5); }
          else { circ(c, '#5fb04e', x - 2, gy - 4, 4.5); circ(c, '#86cf6b', x - 3, gy - 5, 2); ell(c, '#f4f1e8', x + 4, gy - 2, 2.5, 5); R(c, '#4f9a3e', x + 3, gy - 10, 2, 4); }
        }
        const aw = Math.round(H * 0.34);
        for (let x = 0, i = 0; x < W; x += 8, i++) R(c, i % 2 ? '#fbf6ea' : b.stripe, x, 2, 8, aw);
        for (let x = 4, i = 0; x < W; x += 8, i++) circ(c, i % 2 ? '#fbf6ea' : b.stripe, x, aw + 2, 4);
        R(c, '#00000022', 0, 2, W, 2);
        break;
      }
    }
  };

  // ---------------------------------------------------------------- 사물
  TT.drawObject = function (c, o, t) {
    const x = o.x * 32, y = o.y * 32, W = (o.w || 1) * 32, H = (o.h || 1) * 32;
    c.save(); c.translate(x, y);
    switch (o.kind) {
      case 'sign':
        ell(c, 'rgba(0,0,0,.15)', 16, 30, 7, 2);
        R(c, '#7a4a25', 14, 14, 4, 17);
        rrect(c, '#6b4423', 2, 3, 28, 15, 2); rrect(c, '#b07a44', 3, 4, 26, 13, 2);
        R(c, '#6b4423', 7, 8, 18, 2); R(c, '#6b4423', 7, 12, 13, 2);
        break;
      case 'notice': {
        ell(c, 'rgba(0,0,0,.15)', 16, 30, 13, 2);
        R(c, '#7a4a25', 3, 4, 3, 27); R(c, '#7a4a25', 26, 4, 3, 27);
        R(c, '#5c3317', 1, 2, 30, 4);
        R(c, '#f6edd5', 5, 7, 22, 17);
        c.strokeStyle = '#222'; c.lineWidth = 1;
        const r = rng(99);
        for (let col = 0; col < 4; col++) for (let k = 0; k < 4; k++) {
          const sx = 23 - col * 5, sy = 9 + k * 3.8;
          c.beginPath(); c.moveTo(sx - 1.5, sy); c.lineTo(sx + 1.5, sy + r() * 2); c.moveTo(sx, sy - 1); c.lineTo(sx - r(), sy + 2.5); c.stroke();
        }
        R(c, '#c0392b', 8, 20, 3, 3);
        break;
      }
      case 'sundial': {
        const fixed = TT.state && TT.state.flags && TT.state.flags.sundial;
        ell(c, 'rgba(0,0,0,.15)', 16, 30, 10, 2.5);
        R(c, '#a39e95', 10, 17, 12, 13); R(c, '#bdb8af', 6, 15, 20, 4);
        if (!fixed) { c.save(); c.translate(16, 11); c.rotate(0.35); c.translate(-16, -11); }
        c.fillStyle = '#b8843a'; c.beginPath(); c.ellipse(16, 11, 12, 8, 0, 0, Math.PI); c.fill();
        ell(c, '#d6a75a', 16, 11, 12, 4); ell(c, '#8a5e24', 16, 11, 9.5, 2.8);
        c.strokeStyle = '#4a2f10'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(9, 11); c.lineTo(21, 6); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(16, 11); c.lineTo(22, 12.5); c.stroke();
        if (!fixed) {
          c.restore();
          const wob = Math.sin(t * 6) * 1.5;
          c.fillStyle = '#5b3a1e'; c.font = 'bold 10px sans-serif'; c.textAlign = 'center';
          c.fillText('?', 27 + wob, 4); c.fillText('?', 5 - wob, 6);
        }
        break;
      }
      case 'armillary': {
        const done = TT.state && TT.state.flags && TT.state.flags.astro;
        ell(c, 'rgba(0,0,0,.15)', 16, 29, 13, 3);
        c.lineWidth = 2;
        if (done) {
          R(c, '#6e3f1d', 9, 24, 14, 6); R(c, '#8b5a2e', 12, 18, 8, 7);
          c.strokeStyle = '#c99a3a';
          c.beginPath(); c.arc(16, 6, 12, 0, Math.PI * 2); c.stroke();
          c.beginPath(); c.ellipse(16, 6, 12, 4, 0, 0, Math.PI * 2); c.stroke();
          c.beginPath(); c.ellipse(16, 6, 12, 5, -0.6, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = '#5a3a14'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(9, 14); c.lineTo(23, -2); c.stroke();
        } else {
          c.strokeStyle = '#c99a3a';
          c.beginPath(); c.ellipse(11, 22, 9, 3.5, 0.1, 0, Math.PI * 2); c.stroke();
          c.beginPath(); c.ellipse(20, 25, 8, 3, -0.2, 0, Math.PI * 2); c.stroke();
          c.beginPath(); c.ellipse(17, 19, 7, 2.5, 0.3, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = '#5a3a14'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(4, 28); c.lineTo(15, 26); c.stroke();
          R(c, '#8b5a2e', 22, 15, 7, 6);
        }
        break;
      }
      case 'jars':
        for (const [jx, jy, s] of [[9, 20, 1], [22, 20, 1.1], [15, 26, 0.9]]) {
          ell(c, 'rgba(0,0,0,.15)', jx, jy + 6 * s, 7 * s, 2);
          ell(c, '#6e3f22', jx, jy, 7 * s, 8 * s); ell(c, '#8a5434', jx - 2, jy - 2, 2, 3);
          ell(c, '#4a2a16', jx, jy - 7 * s, 4.5 * s, 2);
        }
        break;
      case 'well':
        ell(c, 'rgba(0,0,0,.15)', 16, 28, 13, 3);
        ell(c, '#9a948a', 16, 20, 13, 9); ell(c, '#b2aca2', 16, 18, 12, 7); ell(c, '#2f4a66', 16, 18, 8, 4.5);
        R(c, '#7a4a25', 3, 2, 3, 20); R(c, '#7a4a25', 26, 2, 3, 20); R(c, '#5c3317', 2, 2, 28, 3);
        R(c, '#8a8a8a', 15, 5, 1, 9); R(c, '#6e3f22', 12, 13, 7, 5);
        break;
      case 'crate':
        ell(c, 'rgba(0,0,0,.15)', 16, 30, 12, 2);
        R(c, '#7a4a25', 4, 8, 24, 22); R(c, '#a8713d', 5, 9, 22, 20);
        c.strokeStyle = '#7a4a25'; c.lineWidth = 2; c.beginPath(); c.moveTo(5, 9); c.lineTo(27, 29); c.moveTo(27, 9); c.lineTo(5, 29); c.stroke();
        break;
      case 'rain':
        ell(c, 'rgba(0,0,0,.15)', 16, 30, 10, 2.5);
        R(c, '#9d978b', 7, 21, 18, 9); R(c, '#b5afa3', 7, 21, 18, 2);
        R(c, '#3f7f7a', 11, 4, 10, 17); R(c, '#5aa39d', 12, 5, 3, 15); R(c, '#2d5f5b', 11, 8, 10, 1.5); R(c, '#2d5f5b', 11, 15, 10, 1.5);
        ell(c, '#244b48', 16, 4, 5, 1.6);
        break;
      case 'drum':
        ell(c, 'rgba(0,0,0,.15)', 16, 30, 12, 2);
        R(c, '#8a3a2a', 3, 4, 3, 26); R(c, '#8a3a2a', 26, 4, 3, 26); R(c, '#6e2a1e', 2, 3, 28, 3);
        circ(c, '#b0332a', 16, 16, 10); circ(c, '#efe0bd', 16, 16, 7.5);
        c.fillStyle = '#c0392b'; c.beginPath(); c.arc(16, 16, 4, 0, Math.PI); c.fill();
        c.fillStyle = '#2f5fa8'; c.beginPath(); c.arc(16, 16, 4, Math.PI, Math.PI * 2); c.fill();
        break;
      case 'shelf': {
        R(c, '#5c3317', 0, -14, W, H + 12); R(c, '#7a4a25', 2, -12, W - 4, H + 8);
        const r = rng(o.x * 13 + o.y);
        for (let sy = -10; sy < H - 6; sy += 13) {
          R(c, '#5c3317', 2, sy + 11, W - 4, 2);
          for (let sx = 4; sx < W - 12; sx += 14) {
            const n = 2 + ((r() * 3) | 0);
            for (let k = 0; k < n; k++) {
              const cy = sy + 9 - k * 3;
              R(c, k % 2 ? '#e8dcbc' : '#d9c79a', sx, cy, 11, 2.6);
              R(c, '#8a2f2a', sx + 1, cy + 0.5, 1, 1.6); R(c, '#8a2f2a', sx + 9, cy + 0.5, 1, 1.6);
            }
          }
        }
        break;
      }
      case 'desk':
        ell(c, 'rgba(0,0,0,.15)', 16, 28, 14, 3);
        R(c, '#6e3f1d', 4, 20, 3, 8); R(c, '#6e3f1d', 25, 20, 3, 8);
        R(c, '#8b5a2e', 1, 14, 30, 7); R(c, '#a8713d', 1, 14, 30, 2);
        R(c, '#f4ecd6', 7, 9, 16, 6); R(c, '#c9b48a', 15, 9, 1, 6);
        c.fillStyle = '#222'; for (let k = 0; k < 3; k++) { R(c, '#333', 9, 10.5 + k * 1.5, 4, 0.6); R(c, '#333', 17, 10.5 + k * 1.5, 4, 0.6); }
        R(c, '#3a2a1a', 24, 8, 1.5, 7); R(c, '#111', 23.6, 13, 2.2, 2);
        break;
      case 'throne':
        R(c, '#7d2620', 0, 14, W, 18); R(c, '#9e3029', 0, 14, W, 3);
        for (let k = 0; k < 3; k++) R(c, '#6a1f1a', 0, 20 + k * 4, W, 1);
        rrect(c, '#b8332f', W / 2 - 14, -6, 28, 22, 4); rrect(c, '#d9a441', W / 2 - 11, -3, 22, 14, 3); rrect(c, '#b8332f', W / 2 - 8, 0, 16, 10, 2);
        break;
      case 'screen': {
        R(c, '#5a3a1a', 0, 0, W, H); R(c, '#3e6c8f', 4, 4, W - 8, H - 8);
        const pk = [[0.18, 0.45], [0.34, 0.3], [0.5, 0.15], [0.66, 0.3], [0.82, 0.45]];
        pk.forEach(([px, py], i) => {
          c.fillStyle = i % 2 ? '#2f7a5e' : '#36906c';
          c.beginPath(); c.moveTo(W * (px - 0.14), H - 18); c.lineTo(W * px, 4 + (H - 8) * py); c.lineTo(W * (px + 0.14), H - 18); c.closePath(); c.fill();
          R(c, '#5ab48a', W * px - 1, 6 + (H - 8) * py, 2, 8);
        });
        circ(c, '#f4f1e8', W * 0.1, 16, 6); circ(c, '#e74c3c', W * 0.9, 16, 6);
        R(c, '#5aa6d6', 4, H - 18, W - 8, 14);
        c.strokeStyle = '#e8f5ff'; c.lineWidth = 1.2;
        for (let wx = 10; wx < W - 8; wx += 12) { c.beginPath(); c.arc(wx, H - 10, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
        R(c, '#8a2f2a', 8, H - 30, 3, 14); ell(c, '#2f6e45', 9, H - 31, 6, 3); R(c, '#8a2f2a', W - 11, H - 30, 3, 14); ell(c, '#2f6e45', W - 10, H - 31, 6, 3);
        break;
      }
      case 'pillar':
        ell(c, 'rgba(0,0,0,.18)', 16, 30, 10, 3);
        R(c, '#a39e95', 7, 25, 18, 6);
        R(c, '#b8382e', 10, -20, 12, 46); R(c, '#d0493e', 12, -20, 3, 46);
        R(c, '#2f8f7b', 9, -22, 14, 5);
        break;
      case 'chart':
        R(c, '#5c3317', 0, 2, W, H - 6); R(c, '#f8f1de', 3, 5, W - 6, H - 12);
        c.fillStyle = '#222'; c.font = '9px "Jua", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('ㄱ ㄴ ㅁ ㅅ ㅇ', W / 2, 11);
        c.fillStyle = '#9b2c2c'; c.fillText('·  ㅡ  ㅣ', W / 2, 21);
        break;
      case 'clockmodel': {
        R(c, '#6e3f1d', 0, 40, W, 22); R(c, '#8b5a2e', 0, 40, W, 3);
        R(c, '#8b5a2e', 2, 6, 26, 36); R(c, '#8b5a2e', 30, 18, 24, 24); R(c, '#8b5a2e', 56, 28, 36, 14);
        ell(c, '#6e3f22', 15, 2, 11, 9); ell(c, '#4ea4e2', 15, -5, 8, 2.5);
        ell(c, '#6e3f22', 42, 14, 8, 7); ell(c, '#4ea4e2', 42, 8, 5.5, 2);
        R(c, '#7a5230', 62, 4, 12, 26); R(c, '#e8c14a', 66, -4, 3, 12);
        circ(c, '#f3d9b0', 82, 12, 4); R(c, '#c8302c', 78, 16, 8, 10); circ(c, '#d9a441', 88, 24, 3.5);
        c.strokeStyle = '#4ea4e2'; c.lineWidth = 2; c.beginPath(); c.moveTo(24, 8); c.lineTo(36, 10); c.moveTo(48, 16); c.lineTo(62, 18); c.stroke();
        break;
      }
      case 'bench':
        ell(c, 'rgba(0,0,0,.15)', W / 2, 30, W / 2 - 2, 3);
        R(c, '#6e3f1d', 3, 18, 3, 12); R(c, '#6e3f1d', W - 6, 18, 3, 12);
        R(c, '#9a6a3a', 0, 12, W, 8); R(c, '#b5814a', 0, 12, W, 2);
        R(c, '#8d8f94', 8, 6, 14, 3); R(c, '#6e3f1d', 20, 5, 6, 5);
        R(c, '#6e3f1d', W - 22, 2, 3, 11); R(c, '#8d8f94', W - 26, 2, 11, 4);
        break;
      case 'gears':
        ell(c, 'rgba(0,0,0,.15)', 16, 28, 12, 3);
        gear(c, 11, 18, 7, '#8d8f94'); gear(c, 22, 22, 5, '#b08a3a'); gear(c, 20, 10, 4, '#a0a3a8');
        break;
      case 'logs':
        ell(c, 'rgba(0,0,0,.15)', 16, 29, 14, 3);
        for (const [lx, ly] of [[9, 22], [23, 22], [16, 14]]) { circ(c, '#8b5a2e', lx, ly, 6.5); circ(c, '#d9b77a', lx, ly, 4.5); circ(c, '#b58d52', lx, ly, 2); }
        break;
      case 'rock':
        ell(c, 'rgba(0,0,0,.15)', 16, 28, 12, 3);
        ell(c, '#9a958c', 16, 20, 12, 9); ell(c, '#b8b3a9', 13, 16, 6, 4);
        break;
    }
    c.restore();
  };

  // ---------------------------------------------------------------- 캐릭터
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  TT.shade = shade;
  function trap(c, col, x1, y1, w1, x2, y2, w2) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 + w1, y1); c.lineTo(x2 + w2, y2); c.lineTo(x2, y2); c.closePath(); c.fill();
  }

  function drawDog(c, x, y, L, dir, phase, moving) {
    const sw = moving ? Math.sin(phase * Math.PI * 2) : 0;
    const body = '#f3eee2', ear = '#e2cfae';
    ell(c, 'rgba(0,0,0,.18)', x, y - 1, 10, 3);
    const by = y - 4;
    if (dir === 1 || dir === 2) {
      const f = dir === 1 ? -1 : 1;
      R(c, body, x - 7, by - 2 + (sw > 0 ? 0 : 1), 3, 5); R(c, body, x + 4, by - 2 + (sw > 0 ? 1 : 0), 3, 5);
      ell(c, body, x, by - 5, 10, 6);
      c.strokeStyle = body; c.lineWidth = 3; c.beginPath(); c.arc(x - f * 10, by - 10, 4, 0, Math.PI * 2 * 0.6); c.stroke();
      circ(c, body, x + f * 9, by - 12, 6);
      ell(c, ear, x + f * 13, by - 10, 3.5, 2.5);
      c.fillStyle = ear; c.beginPath(); c.moveTo(x + f * 6, by - 16); c.lineTo(x + f * 8, by - 22); c.lineTo(x + f * 11, by - 16); c.fill();
      circ(c, '#222', x + f * 15.5, by - 10.5, 1.4); circ(c, '#222', x + f * 10, by - 13, 1.1);
    } else {
      ell(c, body, x, by - 5, 8, 7);
      circ(c, body, x, by - 14, 7);
      c.fillStyle = ear;
      c.beginPath(); c.moveTo(x - 7, by - 16); c.lineTo(x - 5, by - 24); c.lineTo(x - 2, by - 19); c.fill();
      c.beginPath(); c.moveTo(x + 7, by - 16); c.lineTo(x + 5, by - 24); c.lineTo(x + 2, by - 19); c.fill();
      if (dir === 0) {
        circ(c, '#222', x - 2.8, by - 15, 1.2); circ(c, '#222', x + 2.8, by - 15, 1.2);
        ell(c, ear, x, by - 11, 3.5, 2.5); circ(c, '#222', x, by - 12, 1.2);
      } else {
        c.strokeStyle = body; c.lineWidth = 3; c.beginPath(); c.arc(x, by - 2, 4, Math.PI, Math.PI * 2.2); c.stroke();
      }
    }
  }

  TT.drawChar = function (c, x, y, L, dir, phase, moving) {
    if (L.kind === 'dog') return drawDog(c, x, y, L, dir, phase, moving);
    const sw = moving ? Math.sin(phase * Math.PI * 2) : 0;
    const bob = moving ? Math.abs(sw) * 1.2 : 0;
    const by = y - bob;
    const side = dir === 1 || dir === 2;
    ell(c, 'rgba(0,0,0,.2)', x, y - 1, 9, 3);

    if (L.skirt) {
      trap(c, L.bottom, x - 6, by - 14, 12, x - 9.5, by - 1, 19);
      R(c, shade(L.bottom, -0.15), x - 9.5, by - 2.5, 19, 1.5);
    } else if (L.robe) {
      R(c, L.shoes || '#2b2b2b', x - 5 + sw * 1.5, by - 3, 4, 3);
      R(c, L.shoes || '#2b2b2b', x + 1 - sw * 1.5, by - 3, 4, 3);
      trap(c, L.top, x - 7, by - 17, 14, x - 8.5, by - 2, 17);
      if (dir === 0) R(c, shade(L.top, -0.2), x - 0.5, by - 12, 1, 10);
    } else {
      const l1 = side ? sw * 2 : 0;
      const lh1 = 8 - (moving && !side ? Math.max(0, sw) * 2 : 0);
      const lh2 = 8 - (moving && !side ? Math.max(0, -sw) * 2 : 0);
      R(c, L.bottom, x - 5 + l1, by - 9, 4.5, lh1); R(c, L.bottom, x + 0.5 - l1, by - 9, 4.5, lh2);
      R(c, L.shoes || '#5a3a22', x - 5 + l1, by - 9 + lh1 - 2, 4.5, 2); R(c, L.shoes || '#5a3a22', x + 0.5 - l1, by - 9 + lh2 - 2, 4.5, 2);
    }
    if (!L.robe) rrect(c, L.top, x - 6.5, by - 17, 13, L.skirt ? 5.5 : 9, 3);
    if (L.extra === 'device' && dir === 3) { rrect(c, '#6a4fb3', x - 5, by - 18, 10, 10, 2); circ(c, '#5ef2ff', x, by - 13, 2.2); }
    if (dir === 0) {
      if (L.collar !== false) {
        c.strokeStyle = L.collar || '#fbf7ec'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(x - 3.5, by - 17); c.lineTo(x + 0.5, by - 12.5); c.lineTo(x + 2.5, by - 17); c.stroke();
      }
      if (L.ribbon) R(c, L.ribbon, x + 0.5, by - 13, 1.6, 4.5);
      if (L.emblem) { circ(c, L.emblem, x, by - 12.5, 3.2); circ(c, shade(L.emblem, -0.25), x, by - 12.5, 1.6); }
      if (L.extra === 'apron') R(c, '#8a6a45', x - 5, by - 12, 10, L.robe ? 10 : 9);
      if (L.extra === 'device') { R(c, '#ffffff', x - 2, by - 15, 4, 3); }
    }
    if (L.belt && dir !== 3) R(c, L.belt, x - 7, by - 9.5, 14, 2);
    const asw = moving ? sw * 2 : 0;
    if (!side) {
      rrect(c, L.top, x - 9.5, by - 17 + asw * 0.5, 3.5, 9, 1.5);
      rrect(c, L.top, x + 6, by - 17 - asw * 0.5, 3.5, 9, 1.5);
      circ(c, L.skin, x - 7.7, by - 7.5 + asw * 0.5, 1.8); circ(c, L.skin, x + 7.7, by - 7.5 - asw * 0.5, 1.8);
      if (L.extra === 'device' && dir === 0) { circ(c, '#5ef2ff', x - 7.7, by - 9.5, 1.6); }
    } else {
      const ax = dir === 1 ? x - 1 : x - 2.5;
      rrect(c, shade(L.top, -0.08), ax + asw * 0.7, by - 17, 3.5, 9, 1.5);
      circ(c, L.skin, ax + 1.7 + asw * 0.7, by - 7.5, 1.8);
      if (L.extra === 'device') circ(c, '#5ef2ff', ax + 1.7 + asw * 0.7, by - 9.5, 1.5);
    }

    // 머리
    const hy = by - 25;
    const fx = dir === 1 ? -1.6 : dir === 2 ? 1.6 : 0;
    if (L.hat === 'bun' && dir === 0) circ(c, L.hair, x, hy - 6, 3.5);
    circ(c, L.hair, x, hy - 0.5, 8.5);
    if (dir !== 3) {
      ell(c, L.skin, x + fx, hy + 1.3, 7.3, 6.6);
      c.fillStyle = L.hair; c.beginPath(); c.ellipse(x + fx * 0.4, hy - 2.6, 8.2, 4.2, 0, Math.PI, 0); c.fill();
      const eye = '#2b1d14';
      if (dir === 0) {
        R(c, eye, x - 3.4, hy + 0.6, 1.8, 2.5); R(c, eye, x + 1.6, hy + 0.6, 1.8, 2.5);
        ell(c, 'rgba(240,130,130,.45)', x - 4.6, hy + 3.8, 1.7, 1); ell(c, 'rgba(240,130,130,.45)', x + 4.6, hy + 3.8, 1.7, 1);
        R(c, '#9b4a3a', x - 0.8, hy + 4.3, 1.6, 0.8);
      } else {
        R(c, eye, x + (dir === 1 ? -4.6 : 2.8), hy + 0.6, 1.8, 2.5);
        ell(c, 'rgba(240,130,130,.45)', x + (dir === 1 ? -3 : 3), hy + 3.8, 1.6, 1);
      }
      if (L.beard) {
        const bc = L.beardColor || '#2a211b';
        if (dir === 0) { R(c, bc, x - 3.2, hy + 3.6, 2.4, 0.9); R(c, bc, x + 0.8, hy + 3.6, 2.4, 0.9); trap(c, bc, x - 1.2, hy + 6, 2.4, x - 0.6, hy + 10, 1.2); }
        else { const bx = x + (dir === 1 ? -4 : 2.5); trap(c, bc, bx, hy + 5.5, 2, bx + 0.4, hy + 9.5, 1); }
      }
    }
    // 모자 / 머리 모양
    const dk = '#1d1d22';
    switch (L.hat) {
      case 'sangtu': circ(c, L.hair, x, hy - 9, 2.8); break;
      case 'gat':
        circ(c, L.hair, x, hy - 9, 2.5);
        ell(c, 'rgba(22,22,28,.82)', x, hy - 6, 13.5, 3.3);
        rrect(c, 'rgba(22,22,28,.9)', x - 4.5, hy - 15, 9, 9, 2.5);
        break;
      case 'crown':
        c.fillStyle = dk; c.beginPath(); c.ellipse(x, hy - 3.5, 9, 8, 0, Math.PI, 0); c.fill();
        R(c, dk, x - 9, hy - 4.5, 18, 2.5);
        rrect(c, dk, x - 5, hy - 15, 10, 8, 3);
        if (dir !== 1) ell(c, '#2a2a33', x + 7.5, hy - 15, 2.6, 4.2);
        if (dir !== 2) ell(c, '#2a2a33', x - 7.5, hy - 15, 2.6, 4.2);
        R(c, '#e8c14a', x - 9, hy - 3.5, 18, 0.8);
        break;
      case 'samo':
        c.fillStyle = dk; c.beginPath(); c.ellipse(x, hy - 3.5, 8.8, 7.5, 0, Math.PI, 0); c.fill();
        rrect(c, dk, x - 5, hy - 14, 10, 7, 3);
        if (!side) { ell(c, dk, x - 11.5, hy - 8, 4.5, 1.8); ell(c, dk, x + 11.5, hy - 8, 4.5, 1.8); }
        else ell(c, dk, x + (dir === 1 ? 6 : -6), hy - 9, 2, 3.5);
        break;
      case 'guard':
        ell(c, '#26262c', x, hy - 6, 12.5, 3.2); ell(c, '#33333b', x, hy - 10, 6, 5);
        circ(c, '#d8342c', x, hy - 15, 2.6); R(c, '#e8c14a', x - 6, hy - 7.5, 12, 1);
        break;
      case 'bun':
        if (dir !== 0) {
          circ(c, L.hair, x + (dir === 1 ? 6 : dir === 2 ? -6 : 0), hy + (dir === 3 ? 4 : 1), 3.8);
          R(c, '#e8c547', x + (dir === 1 ? 2 : dir === 2 ? -10 : -5), hy + (dir === 3 ? 3.5 : 0.5), 8, 1.2);
        }
        break;
      case 'braid':
        if (dir === 3) { R(c, L.hair, x - 1.5, hy + 6, 3, 9); R(c, '#e74c3c', x - 2.5, hy + 13, 5, 2.5); }
        else if (side) { R(c, L.hair, x + (dir === 1 ? 5 : -8), hy + 4, 3, 8); R(c, '#e74c3c', x + (dir === 1 ? 4 : -9), hy + 11, 5, 2.5); }
        break;
      case 'towel':
        R(c, '#f4f1e6', x - 8.6, hy - 5.5, 17.2, 3.2);
        if (dir !== 2) circ(c, '#f4f1e6', x - 8, hy - 4, 2.2);
        break;
      case 'kidhair':
        c.fillStyle = L.hair;
        for (const [a, b2] of [[-6, -10], [-1, -12], [4, -10.5]]) { c.beginPath(); c.moveTo(x + a - 3, hy - 6); c.lineTo(x + a, hy + b2); c.lineTo(x + a + 3, hy - 6); c.fill(); }
        R(c, '#3a3f4a', x - 8.6, hy - 5.2, 17.2, 2);
        if (dir === 0) { circ(c, '#5ef2ff', x - 3.3, hy - 4.6, 2.4); circ(c, '#5ef2ff', x + 3.3, hy - 4.6, 2.4); R(c, '#fff', x - 4.3, hy - 5.8, 1.2, 1.2); R(c, '#fff', x + 2.3, hy - 5.8, 1.2, 1.2); }
        else if (side) { circ(c, '#5ef2ff', x + (dir === 1 ? -5 : 5), hy - 4.6, 2.4); }
        break;
    }
  };

  // 대화창 초상화
  TT.drawPortrait = function (canvas, look) {
    const c = canvas.getContext('2d');
    const S = canvas.width;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, S, S);
    const g = c.createRadialGradient(S / 2, S * 0.45, 4, S / 2, S / 2, S * 0.7);
    g.addColorStop(0, '#fff8e6'); g.addColorStop(1, '#f0dcb0');
    c.fillStyle = g; c.fillRect(0, 0, S, S);
    if (look === 'device') {
      const k = S / 100;
      c.setTransform(k, 0, 0, k, 0, 0);
      circ(c, '#8a6a2a', 50, 52, 36); circ(c, '#d9b04a', 50, 50, 34); circ(c, '#1c2b3a', 50, 50, 26);
      R(c, '#d9b04a', 44, 8, 12, 8); circ(c, '#d9b04a', 50, 8, 6);
      c.strokeStyle = '#5ef2ff'; c.lineWidth = 2;
      c.beginPath(); c.arc(50, 50, 22, -Math.PI / 2, Math.PI * 0.9); c.stroke();
      R(c, '#5ef2ff', 38, 42, 6, 9); R(c, '#5ef2ff', 56, 42, 6, 9);
      c.beginPath(); c.arc(50, 58, 6, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(70, 30); c.lineTo(63, 38); c.lineTo(68, 41); c.lineTo(61, 48); c.stroke();
      return;
    }
    const k = S / 38;
    c.setTransform(k, 0, 0, k, S / 2, 43 * k);
    TT.drawChar(c, 0, 0, look, 0, 0, false);
  };
})();
