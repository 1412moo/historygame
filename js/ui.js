// 대화창, 모달, 보상, 도감, 지도 등 UI
(function () {
  const TT = window.TT;
  const $ = s => document.querySelector(s);
  const ui = (TT.ui = {});

  const dlg = $('#dialog'), nameEl = $('#dlg-name'), textEl = $('#dlg-text'), choicesEl = $('#dlg-choices'), nextEl = $('#dlg-next');
  const portrait = $('#dlg-portrait canvas');
  const modal = $('#modal'), narration = $('#narration'), narrText = $('#narr-text');

  let advanceHandler = null, typing = null;
  let choiceState = null;
  let narrHandler = null;

  const fmt = t => String(t).replace(/\{name\}/g, (TT.state && TT.state.name) || '여행자');
  ui.fmt = fmt;
  ui.dialogOpen = () => !dlg.classList.contains('hidden');
  ui.modalOpen = () => modal.classList.contains('show');
  ui.narrOpen = () => !narration.classList.contains('hidden');
  ui.choiceActive = () => !!choiceState;

  function setSpeaker(spk) {
    const name = spk ? (typeof spk.name === 'function' ? spk.name() : spk.name) : '';
    nameEl.textContent = name || '';
    nameEl.style.display = name ? '' : 'none';
    const look = spk && spk.look;
    $('#dlg-portrait').style.display = look ? '' : 'none';
    $('#dlg-replay').style.display = TT.voice.available() && !(TT.state && TT.state.voiceOff) ? '' : 'none';
    if (look) TT.drawPortrait(portrait, look);
  }

  ui.say = function (spk, text) {
    return new Promise(res => {
      const full = fmt(text);
      dlg.classList.remove('hidden');
      document.body.classList.add('dialog-open');
      setSpeaker(spk);
      TT.voice.speak(full, spk);
      choicesEl.innerHTML = '';
      nextEl.style.visibility = 'hidden';
      textEl.textContent = '';
      clearInterval(typing);
      let i = 0;
      const finish = () => { clearInterval(typing); typing = null; textEl.textContent = full; nextEl.style.visibility = 'visible'; };
      typing = setInterval(() => {
        i++;
        textEl.textContent = full.slice(0, i);
        if (i % 2 === 0 && full[i - 1] !== ' ' && !TT.voice.active()) TT.sfx.blip();
        if (i >= full.length) finish();
      }, 26);
      advanceHandler = () => {
        if (typing) { finish(); return; }
        advanceHandler = null;
        res();
      };
    });
  };
  ui.advance = () => { if (advanceHandler) advanceHandler(); };

  // 선택지: 고른 대사를 플레이어가 말한 것으로 보여준 뒤 index 반환
  ui.choice = function (options, opts) {
    opts = opts || {};
    return new Promise(res => {
      dlg.classList.remove('hidden');
      document.body.classList.add('dialog-open');
      if (opts.prompt) { setSpeaker(TT.PLAYER); textEl.textContent = fmt(opts.prompt); }
      nextEl.style.visibility = 'hidden';
      choicesEl.innerHTML = '';
      const btns = options.map((o, i) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = fmt(o);
        b.onclick = e => { e.stopPropagation(); pick(i); };
        b.onmouseenter = () => highlight(i);
        choicesEl.appendChild(b);
        return b;
      });
      const highlight = i => { choiceState.idx = i; btns.forEach((b, k) => b.classList.toggle('sel', k === i)); };
      const pick = async i => {
        if (!choiceState) return;
        choiceState = null;
        choicesEl.innerHTML = '';
        TT.sfx.select();
        if (opts.silent) return res(i);
        await ui.say(TT.PLAYER, options[i]);
        res(i);
      };
      choiceState = { idx: 0, btns, pick, highlight };
      // 선택지는 읽지 않는다: 고른 대사는 위 pick() 의 ui.say(TT.PLAYER, …) 에서 한 번만 읽힌다
      highlight(0);
    });
  };
  ui.moveChoice = d => { if (choiceState) { const n = choiceState.btns.length; choiceState.highlight((choiceState.idx + d + n) % n); TT.sfx.blip(); } };
  ui.pickChoice = () => { if (choiceState) choiceState.pick(choiceState.idx); };

  ui.closeDialog = () => {
    dlg.classList.add('hidden');
    document.body.classList.remove('dialog-open');
    TT.voice.stop();
    advanceHandler = null; choiceState = null;
    clearInterval(typing); typing = null;
  };
  dlg.addEventListener('click', () => { if (!choiceState) ui.advance(); });
  $('#dlg-replay').addEventListener('click', e => { e.stopPropagation(); TT.voice.replay(); });

  // ----------------------------------------------------------- 모달
  ui.modal = (html, cls) => { modal.innerHTML = html; modal.className = 'show ' + (cls || ''); return modal; };
  ui.closeModal = () => { modal.className = ''; modal.innerHTML = ''; if (TT.voice) TT.voice.stop(); };

  // 정보 카드 (버튼 누르면 닫힘)
  ui.card = function (html, btn) {
    return new Promise(res => {
      const m = ui.modal(`<div class="panel card">${html}<div class="row"><button class="primary big">${btn || '알겠어요!'}</button></div></div>`);
      // 녹음 열쇠: 카드 HTML 의 글자(textContent, 공백 정리) — 화면 배치에 따라 달라지는 innerText 대신 쓴다
      const box = document.createElement('div');
      box.innerHTML = html;
      const key = box.textContent.replace(/\s+/g, ' ').trim();
      TT.voice.speak(TT.voice.hasRecording(key) ? key : m.querySelector('.card').innerText.replace(btn || '알겠어요!', ''), null, { noRemember: true });
      m.querySelector('.primary').onclick = () => { TT.sfx.select(); TT.voice.stop(); ui.closeModal(); res(); };
    });
  };

  // ----------------------------------------------------------- 나레이션
  ui.narrate = async function (lines, opts) {
    narration.classList.remove('hidden');
    narration.classList.toggle('flash', !!(opts && opts.flash));
    for (const line of lines) {
      narrText.classList.remove('show');
      void narrText.offsetWidth;
      narrText.innerHTML = fmt(line);
      narrText.classList.add('show');
      TT.sfx.blip();
      TT.voice.speak(line, null, { noRemember: true });
      await new Promise(res => { narrHandler = res; });
    }
    narrHandler = null;
    TT.voice.stop();
    narration.classList.add('hidden');
  };
  ui.narrAdvance = () => { if (narrHandler) { const h = narrHandler; narrHandler = null; h(); } };
  narration.addEventListener('click', ui.narrAdvance);

  // ----------------------------------------------------------- 토스트 & 배너
  ui.toast = function (text) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = fmt(text);
    $('#toasts').appendChild(d);
    setTimeout(() => d.classList.add('out'), 2300);
    setTimeout(() => d.remove(), 2800);
  };
  let bannerTimer = null;
  ui.banner = function (text) {
    const b = $('#zone-banner');
    b.textContent = text;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.remove('show'), 2200);
  };

  // ----------------------------------------------------------- 보상
  ui.reward = function (r) {
    return new Promise(res => {
      const dexHtml = (r.dex || []).map(id => {
        const d = TT.DEX.find(e => e.id === id);
        return d ? `<div class="reward-dex"><span class="emo">${d.emoji}</span><div><b>📖 역사 도감에 기록!</b><br>✓ ${d.name}</div></div>` : '';
      }).join('');
      const m = ui.modal(`<div class="panel reward">
        <div class="burst"></div>
        ${r.title ? `<h2>${fmt(r.title)}</h2>` : ''}
        ${r.shards ? `<div class="shard-gain">⏳ 시간 조각 <b>+${r.shards}</b></div>` : ''}
        ${r.text ? `<p>${fmt(r.text)}</p>` : ''}
        ${dexHtml}
        <div class="row"><button class="primary big">좋아요!</button></div></div>`, 'reward-modal');
      TT.sfx.reward();
      const names = (r.dex || []).map(id => (TT.DEX.find(e => e.id === id) || {}).name).filter(Boolean);
      setTimeout(() => TT.voice.speak(`${fmt(r.title || '')}. ${r.shards ? `시간 조각 ${r.shards}개!` : ''} ${names.length ? `역사 도감에 ${names.join(', ')} 기록!` : ''}`, null, { noRemember: true }), 500);
      m.querySelector('.primary').onclick = () => { TT.sfx.select(); TT.voice.stop(); ui.closeModal(); res(); };
    });
  };

  // ----------------------------------------------------------- HUD
  ui.updateHUD = function () {
    const s = TT.state;
    if (!s) return;
    $('#shard-count').textContent = s.shards;
    const obj = TT.story.objective();
    $('#objective').innerHTML = obj ? `<span class="obj-label">목표</span> ${fmt(obj.text)}` : '';
    $('#shards').classList.toggle('full', s.shards >= 50);
  };
  ui.bumpShards = () => { const e = $('#shards'); e.classList.remove('pulse'); void e.offsetWidth; e.classList.add('pulse'); };

  // ----------------------------------------------------------- 도감
  ui.openDex = function () {
    const s = TT.state;
    const got = TT.DEX.filter(d => s.dex[d.id]).length;
    const cards = TT.DEX.map(d => {
      const has = !!s.dex[d.id];
      if (has) return `<div class="dex-card got"><div class="emo">${d.emoji}</div><div class="dex-info"><h3>✓ ${d.name}${d.bonus ? ' <span class="tag">보너스</span>' : ''}</h3><div class="year">${d.year || ''}</div><p>${d.desc}</p></div></div>`;
      return `<div class="dex-card locked"><div class="emo">${d.future ? '🔒' : '❔'}</div><div class="dex-info"><h3>□ ${d.name}</h3><p>${d.future ? '다음 시간여행에서 만날 수 있어요!' : '아직 기록되지 않았어요. 한양을 더 탐험해 보세요!'}</p></div></div>`;
    }).join('');
    const m = ui.modal(`<div class="panel dex"><div class="panel-head"><h2>📖 역사 도감</h2><span class="count">${got} / ${TT.DEX.length}</span><button class="close" aria-label="닫기">✕</button></div>
      <div class="dex-list">${cards}</div></div>`, 'closable');
    m.querySelector('.close').onclick = ui.closeModal;
  };

  // ----------------------------------------------------------- 지도
  ui.openMap = function () {
    const m = TT.maps.hanyang;
    const el = ui.modal(`<div class="panel mapview"><div class="panel-head"><h2>🗺️ 한양 지도</h2><button class="close" aria-label="닫기">✕</button></div>
      <canvas id="minimap"></canvas><p class="map-legend"><span class="me">●</span> 나 &nbsp; <span class="goal">★</span> 목표</p></div>`, 'closable');
    el.querySelector('.close').onclick = ui.closeModal;
    const cv = el.querySelector('#minimap');
    const k = 10;
    cv.width = m.w * k; cv.height = m.h * k;
    const c = cv.getContext('2d');
    const T = TT.T;
    const col = { [T.GRASS]: '#9fd477', [T.FLOWER]: '#a9d97f', [T.ROAD]: '#e9cf9f', [T.PLAZA]: '#ddd4c1', [T.WATER]: '#5aaee6', [T.BRIDGE]: '#b9844f', [T.TREE]: '#3f8f45', [T.PINE]: '#2e6e45', [T.BUSH]: '#4c9f4f', [T.WALL]: '#6f6a62', [T.FENCE]: '#9a6a3a', [T.BLOCK]: '#ddd4c1', [T.SAND]: '#e3cb9c' };
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { c.fillStyle = col[m.tiles[y * m.w + x]] || '#999'; c.fillRect(x * k, y * k, k, k); }
    m.buildings.forEach(b => { c.fillStyle = b.style === 'stall' ? '#d6904a' : b.style === 'choga' ? '#d8b05a' : '#4a5263'; c.fillRect(b.x * k + 1, b.y * k + 1, b.w * k - 2, b.h * k - 2); });
    c.font = 'bold 15px Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const lab = (t, x, y) => { c.lineWidth = 4; c.strokeStyle = '#fff'; c.strokeText(t, x * k, y * k); c.fillStyle = '#3b2412'; c.fillText(t, x * k, y * k); };
    lab('🏯 궁궐', 22, 5); lab('📚 집현전', 35.5, 9.8); lab('🏠 마을', 7.5, 10); lab('🏪 시장', 22, 29.5); lab('🔧 장영실 작업장', 36, 31); lab('🚪 숭례문', 22, 41.2); lab('🛤️ 큰길', 28, 19.5);
    const tgt = TT.objectiveTile('hanyang');
    if (tgt) { c.font = '22px sans-serif'; c.fillStyle = '#ffcc00'; c.strokeStyle = '#7a4a00'; c.lineWidth = 3; c.strokeText('★', (tgt.x + 0.5) * k, (tgt.y + 0.5) * k); c.fillText('★', (tgt.x + 0.5) * k, (tgt.y + 0.5) * k); }
    let p = TT.player;
    let px = p.x, py = p.y;
    if (TT.map.id !== 'hanyang') { const d = TT.doorOfMap(TT.map.id); if (d) { px = d.x; py = d.y; } }
    c.fillStyle = '#e8463c'; c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.beginPath(); c.arc((px + 0.5) * k, (py + 0.5) * k, 7, 0, Math.PI * 2); c.stroke(); c.fill();
  };

  // ----------------------------------------------------------- 설정
  ui.openMenu = function () {
    const s = TT.state;
    const m = ui.modal(`<div class="panel menu"><div class="panel-head"><h2>⚙️ 설정</h2><button class="close" aria-label="닫기">✕</button></div>
      <div class="col">
        <button class="big" id="m-music">${s.musicOff ? '🎵 배경 음악 켜기' : '🎵 배경 음악 끄기'}</button>
        ${TT.voice.available() ? `<button class="big" id="m-voice">${s.voiceOff ? '🗣️ 읽어주기 켜기' : '🗣️ 읽어주기 끄기'}</button>
        <button class="big" id="m-slow">${s.voiceSlow ? '🐇 보통 빠르기로 읽기' : '🐢 천천히 읽기'}</button>` : '<button class="big" disabled>🗣️ 이 기기에는 한국어 음성이 없어요</button>'}
        <button class="big" id="m-sound">${s.muted ? '🔇 효과음 켜기' : '🔊 효과음 끄기'}</button>
        <button class="big" id="m-help">❓ 조작 방법</button>
        <button class="big danger" id="m-reset">🗑️ 처음부터 다시 하기</button>
      </div></div>`, 'closable');
    m.querySelector('.close').onclick = ui.closeModal;
    m.querySelector('#m-sound').onclick = () => { s.muted = !s.muted; TT.save(); ui.openMenu(); };
    const mv = m.querySelector('#m-voice'), ms = m.querySelector('#m-slow');
    if (mv) mv.onclick = () => { s.voiceOff = !s.voiceOff; TT.voice.stop(); TT.save(); ui.openMenu(); if (!s.voiceOff) TT.voice.speak('읽어주기를 켰어요!', null, { noRemember: true }); };
    if (ms) ms.onclick = () => { s.voiceSlow = !s.voiceSlow; TT.save(); ui.openMenu(); TT.voice.speak(s.voiceSlow ? '이제 천천히 읽어 줄게요.' : '보통 빠르기로 읽어 줄게요.', null, { noRemember: true }); };
    m.querySelector('#m-music').onclick = () => { s.musicOff = !s.musicOff; TT.music.apply(); TT.save(); ui.openMenu(); };
    m.querySelector('#m-help').onclick = () => ui.card(`<h2>❓ 조작 방법</h2><p>🎮 <b>이동</b>: 방향키 또는 W A S D<br>💬 <b>말걸기 / 조사 / 다음</b>: 스페이스바, 엔터, E<br>🏃 <b>달리기</b>: Shift 누른 채 이동<br>📖 <b>도감</b>: B &nbsp; 🗺️ <b>지도</b>: M<br>📱 <b>휴대폰</b>: 화면 아래 버튼</p><p>머리 위에 <b class="hl">!</b> 가 있는 사람은 중요한 이야기를 가지고 있어요. 노란 <b class="hl">▼</b> 화살표가 다음 목표를 알려 줘요.</p>`);
    m.querySelector('#m-reset').onclick = () => {
      const c = ui.modal(`<div class="panel card"><h2>정말 처음부터 다시 할까요?</h2><p>모은 시간 조각과 도감이 모두 사라져요.</p><div class="row"><button class="big" id="r-no">아니요</button><button class="big danger" id="r-yes">네, 다시 할래요</button></div></div>`, 'closable');
      c.querySelector('#r-no').onclick = ui.closeModal;
      c.querySelector('#r-yes').onclick = () => { TT.resetGame(); };
    };
  };

  // ----------------------------------------------------------- 이름 입력
  ui.askName = function () {
    return new Promise(res => {
      const m = ui.modal(`<div class="panel card"><div class="big-emo">🧒</div><h2>시간여행자의 이름은?</h2>
        <input id="name-input" maxlength="6" value="하늘" autocomplete="off" />
        <div class="row"><button class="primary big">출발! ✨</button></div></div>`);
      const inp = m.querySelector('#name-input');
      setTimeout(() => { inp.focus(); inp.select(); }, 50);
      const go = () => { const v = inp.value.trim().slice(0, 6) || '하늘'; ui.closeModal(); res(v); };
      m.querySelector('.primary').onclick = go;
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) go(); });
    });
  };

  // ----------------------------------------------------------- 엔딩
  ui.ending = function () {
    return new Promise(res => {
      const s = TT.state;
      const got = TT.DEX.filter(d => s.dex[d.id]).length;
      const m = ui.modal(`<div class="panel ending">
        <div class="big-emo spin">⏳</div>
        <h2>🎉 시간 장치 수리 완료!</h2>
        <p><b>{name}</b> 덕분에 세종대왕의 훈민정음과 장영실의 자격루, 그리고 측우기 이야기를 직접 경험했어요.</p>
        <div class="ending-stats"><div>⏳ 시간 조각<br><b>${s.shards}</b></div><div>📖 역사 도감<br><b>${got} / ${TT.DEX.length}</b></div></div>
        <p class="next-trip">다음 시간여행지: 🔒 <b>준비 중</b><br><small>고려, 삼국 시대... 더 많은 시대가 기다리고 있어요!</small></p>
        <div class="row"><button class="big" id="e-restart">🔁 처음부터</button><button class="primary big" id="e-stay">한양 더 둘러보기</button></div></div>`.replace(/\{name\}/g, fmt('{name}')), 'reward-modal');
      TT.sfx.reward();
      TT.music.play('title');
      m.querySelector('#e-stay').onclick = () => { ui.closeModal(); TT.music.forMap(TT.map.id); res(); };
      m.querySelector('#e-restart').onclick = () => TT.resetGame();
    });
  };
})();
