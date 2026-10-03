// 개발용: TTS 음성 비교 패널 (주소 끝에 ?dev 를 붙이면 🎧 버튼이 보임)
// 같은 게임 대사를 기존 음성 / Edge TTS / ElevenLabs / Typecast / Gemini 로 비교한다.
// 기존 게임 음성(TT.voice)은 그대로 두고, 미리 만든 파일만 따로 재생한다.
(function () {
  const TT = window.TT;
  const DATA = window.TT_VOICE_COMPARE;
  if (!/[?&]dev\b/.test(location.search) || !DATA) return;

  const ENGINES = [
    { key: 'old', name: '기존 음성' },
    { key: 'edge', name: 'Edge TTS' },
    { key: 'elevenlabs', name: 'ElevenLabs' },
    { key: 'typecast', name: 'Typecast' },
    { key: 'gemini', name: 'Gemini' },
  ];
  const audio = new Audio();
  audio.preload = 'auto';
  let playingBtn = null;

  function setPlaying(btn) {
    if (playingBtn) playingBtn.classList.remove('on');
    playingBtn = btn;
    if (btn) btn.classList.add('on');
  }
  function stopAll() {
    audio.pause();
    TT.voice.stop();
    setPlaying(null);
    if (TT.music) TT.music.duck(false);
  }
  audio.addEventListener('ended', () => { setPlaying(null); if (TT.music) TT.music.duck(false); });
  audio.addEventListener('error', () => { setPlaying(null); TT.ui.toast('음성 파일을 불러오지 못했어요: ' + audio.src.split('/').pop()); });

  function play(line, engine, btn, src) {
    stopAll(); // 재생 중인 다른 음성은 멈춤
    setPlaying(btn);
    if (engine === 'old') {
      const npc = line.npc === 'device' ? { name: '똑딱이', look: 'device' } : TT.findNPC(line.npc);
      TT.voice.speak(line.text, npc, { noRemember: true, forceSynth: true });
      return;
    }
    audio.src = src || DATA.files[engine][line.id];
    audio.currentTime = 0;
    if (TT.music) TT.music.duck(true);
    audio.play().catch(() => setPlaying(null));
  }

  function openPanel() {
    const rows = DATA.lines.map((ln, i) => `<div class="vs-row">
        <div class="vs-info"><b>${ln.label}</b><div class="vs-text">"${ln.text}"</div></div>
        <div class="vs-grid">${ENGINES.map(e => {
          const has = e.key === 'old' || (DATA.files[e.key] || {})[ln.id];
          const meta = e.key === 'old' ? '브라우저 읽어주기' : ((DATA.meta[e.key] || {})[ln.id] || '');
          return `<button class="vs-eng ${e.key}" data-line="${i}" data-eng="${e.key}" ${has ? '' : 'disabled'} title="${meta}">▶ ${e.name}${has ? '' : '<small>준비 중</small>'}</button>`;
        }).join('')}</div>
        ${((DATA.alts || {}).typecast || {})[ln.id] ? `<div class="vs-alts"><span>Typecast 재오디션</span>${DATA.alts.typecast[ln.id].map((a, k) =>
          `<button class="vs-eng typecast alt" data-line="${i}" data-alt="${k}" title="${a.why}">▶ ${a.label}</button>`).join('')}</div>` : ''}
      </div>`).join('');
    const m = TT.ui.modal(`<div class="panel vs-panel"><div class="panel-head"><h2>🎧 음성 비교 (개발용)</h2><button class="close" aria-label="닫기">✕</button></div>
      <p class="vs-help">같은 게임 대사를 엔진별로 들어 보세요. 버튼에 마우스를 올리면 사용한 음성 이름이 보여요.</p>
      <div class="vs-list">${rows}</div>
      <div class="row"><button class="big" id="vs-stop">■ 정지</button></div></div>`, 'wide closable');
    m.querySelectorAll('.vs-eng:not(.alt)').forEach(b => (b.onclick = () => play(DATA.lines[+b.dataset.line], b.dataset.eng, b)));
    m.querySelectorAll('.vs-eng.alt').forEach(b => (b.onclick = () => {
      const ln = DATA.lines[+b.dataset.line];
      play(ln, 'typecast', b, DATA.alts.typecast[ln.id][+b.dataset.alt].audio);
    }));
    m.querySelector('#vs-stop').onclick = stopAll;
    m.querySelector('.close').onclick = () => { stopAll(); TT.ui.closeModal(); };
    // Esc·바깥 클릭으로 닫혀도 소리가 남지 않도록
    const watch = setInterval(() => { if (!document.querySelector('.vs-panel')) { clearInterval(watch); stopAll(); } }, 300);
  }

  const btn = document.createElement('button');
  btn.id = 'btn-voicetest';
  btn.title = '음성 비교 (개발용)';
  btn.innerHTML = '🎧<span>비교</span>';
  btn.onclick = () => { if (!TT.busy) openPanel(); };
  document.getElementById('hud-right').prepend(btn);
  TT.voiceSamples = { open: openPanel, stop: stopAll, audio, play };
})();
