// 맵 데이터: 한양(야외) + 실내 3곳
(function () {
  const TT = window.TT;
  const T = TT.T;
  const key = (TT.key = (x, y) => x + ',' + y);

  function newMap(id, name, w, h, fill, opts) {
    return Object.assign({ id, name, w, h, tiles: new Uint8Array(w * h).fill(fill), buildings: [], objects: [], exits: {}, doors: {}, zones: [], labels: [] }, opts || {});
  }
  const get = (TT.getTile = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? -1 : m.tiles[y * m.w + x]));
  function set(m, x, y, t) { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.tiles[y * m.w + x] = t; }
  TT.setTile = set;
  function rect(m, x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(m, i, j, t); }
  function outline(m, x, y, w, h, t) {
    for (let i = x; i < x + w; i++) { set(m, i, y, t); set(m, i, y + h - 1, t); }
    for (let j = y; j < y + h; j++) { set(m, x, j, t); set(m, x + w - 1, j, t); }
  }
  function building(m, b) {
    b.doorTiles = b.doorTiles || [];
    m.buildings.push(b);
    rect(m, b.x, b.y, b.w, b.h, T.BLOCK);
    b.doorTiles.forEach(([dx, dy]) => (m.doors[key(b.x + dx, b.y + dy)] = b.door));
  }
  function obj(m, o) {
    o.w = o.w || 1; o.h = o.h || 1;
    if (o.solid === undefined) o.solid = true;
    m.objects.push(o);
  }

  // ------------------------------------------------------------------ 한양
  function buildHanyang() {
    const m = newMap('hanyang', '한양', 44, 46, T.GRASS, { outdoor: true, bg: '#2e6e45' });
    const r = TT.rng(1443);
    for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) if (x < 2 || x > 41 || y < 2) set(m, x, y, r() < 0.5 ? T.PINE : T.TREE);
    rect(m, 0, 44, 44, 2, T.WALL); // 한양 도성 성곽

    // 궁궐 (경복궁)
    outline(m, 13, 1, 18, 10, T.WALL);
    rect(m, 14, 2, 16, 8, T.PLAZA);
    [[14, 2], [15, 2], [28, 2], [29, 2], [14, 8], [29, 8]].forEach(([x, y]) => set(m, x, y, T.PINE));
    building(m, { id: 'hall', x: 17, y: 2, w: 10, h: 5, style: 'palace' });
    building(m, { id: 'palacegate', x: 19, y: 8, w: 6, h: 3, style: 'gate', label: '🏯 궁궐 (경복궁)', door: 'palace', doorTiles: [[2, 2], [3, 2]], plaque: '光化門' });
    rect(m, 16, 11, 12, 3, T.PLAZA);

    // 길
    rect(m, 21, 14, 2, 28, T.ROAD);
    rect(m, 3, 17, 38, 2, T.ROAD);
    rect(m, 0, 22, 44, 2, T.WATER); // 개천
    rect(m, 21, 22, 2, 2, T.BRIDGE);

    // 마을
    building(m, { id: 'seodang', x: 3, y: 11, w: 5, h: 3, style: 'giwa', label: '📜 서당', door: 'seodang', doorTiles: [[2, 2]], plaque: '書堂' });
    rect(m, 5, 14, 1, 3, T.ROAD);
    building(m, { id: 'house1', x: 9, y: 12, w: 4, h: 3, style: 'choga', door: 'house', doorTiles: [[1, 2]] });
    rect(m, 10, 15, 1, 2, T.ROAD);
    building(m, { id: 'house2', x: 3, y: 6, w: 4, h: 3, style: 'choga', door: 'house', doorTiles: [[1, 2]] });
    building(m, { id: 'house3', x: 8, y: 6, w: 4, h: 3, style: 'giwa', door: 'house', doorTiles: [[2, 2]] });
    obj(m, { id: 'jars', kind: 'jars', x: 3, y: 20 });
    obj(m, { id: 'jars', kind: 'jars', x: 4, y: 20 });
    obj(m, { id: 'well', kind: 'well', x: 9, y: 20 });
    obj(m, { id: 'sign_village', kind: 'sign', x: 13, y: 16 });
    m.labels.push({ x: 8, y: 16.2, text: '🏠 마을' });

    // 집현전
    building(m, { id: 'jiphyeon', x: 32, y: 11, w: 7, h: 4, style: 'hall', label: '📚 집현전', door: 'jiphyeon', doorTiles: [[3, 3]], plaque: '集賢殿' });
    rect(m, 35, 15, 1, 2, T.ROAD);
    [[31, 11], [39, 11], [31, 13], [39, 13]].forEach(([x, y]) => set(m, x, y, T.PINE));

    // 시장
    rect(m, 15, 25, 14, 9, T.PLAZA);
    building(m, { id: 'stallA', x: 15, y: 26, w: 3, h: 2, style: 'stall', goods: 'silk', stripe: '#d64545' });
    building(m, { id: 'stallB', x: 15, y: 30, w: 3, h: 2, style: 'stall', goods: 'tteok', stripe: '#3d7bd9' });
    building(m, { id: 'stallC', x: 26, y: 26, w: 3, h: 2, style: 'stall', goods: 'pottery', stripe: '#2e9e6a' });
    building(m, { id: 'stallD', x: 26, y: 30, w: 3, h: 2, style: 'stall', goods: 'veg', stripe: '#e08a2e' });
    obj(m, { id: 'notice', kind: 'notice', x: 24, y: 25 });
    obj(m, { id: 'sundial', kind: 'sundial', x: 24, y: 29 });
    obj(m, { id: 'sign_market', kind: 'sign', x: 23, y: 24 });
    m.labels.push({ x: 22, y: 34.6, text: '🏪 한양 시장' });

    // 장영실 작업장
    rect(m, 31, 33, 10, 9, T.SAND);
    outline(m, 30, 32, 12, 11, T.FENCE);
    rect(m, 23, 37, 8, 2, T.ROAD); // 입구 (30,37)(30,38) 포함
    building(m, { id: 'workshop', x: 33, y: 33, w: 6, h: 4, style: 'workshop', label: '🔧 장영실 작업장', door: 'workshop', doorTiles: [[2, 3], [3, 3]] });
    obj(m, { id: 'crate', kind: 'crate', x: 30, y: 38 });
    obj(m, { id: 'rain', kind: 'rain', x: 39, y: 39 });
    obj(m, { id: 'gears', kind: 'gears', x: 32, y: 40 });
    obj(m, { id: 'logs', kind: 'logs', x: 37, y: 40 });
    obj(m, { id: 'sign_workshop', kind: 'sign', x: 24, y: 36 });

    // 궁궐 앞
    obj(m, { id: 'drum', kind: 'drum', x: 26, y: 12 });
    obj(m, { id: 'sign_cross', kind: 'sign', x: 23, y: 16 });

    // 한양 입구 (숭례문)
    building(m, { id: 'citygate', x: 19, y: 42, w: 6, h: 3, style: 'gate', closed: true, label: '🚪 숭례문 (한양 입구)', door: 'citygate', doorTiles: [[2, 0], [3, 0]], plaque: '崇禮門' });
    obj(m, { id: 'sign_start', kind: 'sign', x: 19, y: 40 });

    // 숲 / 꽃 (풀밭에만)
    const forest = (x, y, w, h, p) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
        if (get(m, i, j) !== T.GRASS) continue;
        const v = r();
        if (v < p) set(m, i, j, r() < 0.5 ? T.PINE : T.TREE);
        else if (v < p + 0.1) set(m, i, j, T.FLOWER);
        else if (v < p + 0.12) set(m, i, j, T.BUSH);
      }
    };
    forest(2, 2, 11, 3, 0.45);
    forest(31, 2, 11, 7, 0.45);
    forest(2, 25, 12, 19, 0.3);
    forest(14, 35, 5, 5, 0.22);
    forest(24, 40, 6, 4, 0.3);
    forest(30, 24, 12, 7, 0.35);
    forest(14, 12, 6, 4, 0);
    forest(27, 12, 4, 4, 0);
    forest(2, 19, 12, 2, 0);
    for (const yy of [21, 24]) for (let x = 2; x < 42; x++) if ((x < 18 || x > 25) && get(m, x, yy) === T.GRASS && r() < 0.22) set(m, x, yy, T.TREE);

    m.zones = [
      { name: '🔧 장영실 작업장', x: 30, y: 32, w: 12, h: 11 },
      { name: '🏪 한양 시장', x: 14, y: 24, w: 16, h: 11 },
      { name: '🚪 한양 입구 · 숭례문', x: 14, y: 35, w: 16, h: 9 },
      { name: '🏯 궁궐 앞', x: 13, y: 0, w: 18, h: 15 },
      { name: '📚 집현전', x: 30, y: 8, w: 13, h: 9 },
      { name: '🏠 마을', x: 0, y: 4, w: 14, h: 18 },
      { name: '🛤️ 한양 큰길', x: 14, y: 15, w: 30, h: 7 },
    ];
    return m;
  }

  // ------------------------------------------------------------------ 실내
  function interior(id, name, w, h, exits, fill) {
    const m = newMap(id, name, w, h, fill || T.FLOOR, { bg: '#1e1712' });
    rect(m, 0, 0, w, 2, T.IWALL);
    for (let y = 0; y < h; y++) { set(m, 0, y, T.IWALL); set(m, w - 1, y, T.IWALL); }
    rect(m, 0, h - 1, w, 1, T.IWALL);
    exits.forEach(e => { set(m, e.x, h - 1, T.EXIT); m.exits[key(e.x, h - 1)] = e.to; });
    return m;
  }

  function buildPalace() {
    const back = x => ({ map: 'hanyang', x, y: 11, dir: 0 });
    const m = interior('palace_in', '근정전 안', 15, 11, [{ x: 6, to: back(21) }, { x: 7, to: back(21) }, { x: 8, to: back(22) }]);
    m.spawn = { x: 7, y: 9, dir: 3 };
    rect(m, 6, 3, 3, 7, T.MAT);
    obj(m, { id: 'screen', kind: 'screen', x: 5, y: 0, w: 5, h: 2, solid: false });
    obj(m, { id: 'throne', kind: 'throne', x: 6, y: 2, w: 3, h: 1 });
    [[2, 3], [12, 3], [2, 7], [12, 7]].forEach(([x, y]) => obj(m, { id: 'pillar', kind: 'pillar', x, y }));
    return m;
  }
  function buildJiphyeon() {
    const back = { map: 'hanyang', x: 35, y: 15, dir: 0 };
    const m = interior('jiphyeon_in', '집현전 안', 15, 11, [{ x: 6, to: back }, { x: 7, to: back }, { x: 8, to: back }]);
    m.spawn = { x: 7, y: 9, dir: 3 };
    obj(m, { id: 'shelf', kind: 'shelf', x: 1, y: 2, w: 4, h: 1 });
    obj(m, { id: 'shelf', kind: 'shelf', x: 10, y: 2, w: 4, h: 1 });
    obj(m, { id: 'chart', kind: 'chart', x: 6, y: 1, w: 3, h: 1, solid: false });
    obj(m, { id: 'desk', kind: 'desk', x: 3, y: 6 });
    obj(m, { id: 'desk', kind: 'desk', x: 11, y: 6 });
    obj(m, { id: 'desk', kind: 'desk', x: 3, y: 8 });
    return m;
  }
  function buildWorkshop() {
    const back = x => ({ map: 'hanyang', x, y: 37, dir: 0 });
    const m = interior('workshop_in', '장영실 작업장 안', 13, 10, [{ x: 5, to: back(35) }, { x: 6, to: back(35) }, { x: 7, to: back(36) }], T.SAND);
    m.spawn = { x: 6, y: 8, dir: 3 };
    obj(m, { id: 'clockmodel', kind: 'clockmodel', x: 9, y: 2, w: 3, h: 2 });
    obj(m, { id: 'bench', kind: 'bench', x: 1, y: 3, w: 2, h: 1 });
    obj(m, { id: 'gears', kind: 'gears', x: 2, y: 6 });
    obj(m, { id: 'logs', kind: 'logs', x: 10, y: 7 });
    obj(m, { id: 'armillary', kind: 'armillary', x: 10, y: 5 });
    return m;
  }

  TT.buildMaps = function () {
    const maps = {};
    [buildHanyang(), buildPalace(), buildJiphyeon(), buildWorkshop()].forEach(m => (maps[m.id] = m));
    return maps;
  };
})();
