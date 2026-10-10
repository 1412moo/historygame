// 대사 읽어주기 (브라우저 내장 음성 합성 - Web Speech API, 한국어)
(function () {
  const TT = (window.TT = window.TT || {});
  const synth = window.speechSynthesis;
  let ko = [];
  let speaking = false;

  function load() {
    if (!synth) return;
    const score = v => (/natural|online/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
    ko = synth.getVoices().filter(v => /^ko/i.test(v.lang)).sort((a, b) => score(b) - score(a));
  }
  if (synth) {
    load();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', load);
    else synth.onvoiceschanged = load;
  }
  const FEMALE = /heami|sunhi|yuna|jimin|seoyeon|female|google/i;
  const MALE = /injoon|hyunsu|bongjin|gookmin|\bmale/i;
  function pick(g) {
    if (!ko.length) return null;
    if (g === 'f') return ko.find(v => FEMALE.test(v.name)) || ko[0];
    if (g === 'm') return ko.find(v => MALE.test(v.name)) || ko[0];
    return ko[0];
  }

  // 화자별 목소리
  function profile(spk) {
    const L = TT.LOOKS || {};
    const look = spk && spk.look;
    if (!spk) return { g: 'f', pitch: 1, rate: 1 };
    if (look === 'device') return { g: 'f', pitch: 1.7, rate: 1.08 };
    if (look === L.player) return { g: 'f', pitch: 1.35, rate: 1.02 };
    if (look === L.sejong) return { g: 'm', pitch: 0.72, rate: 0.9 };
    if (look === L.girl || look === L.boy) return { g: look === L.girl ? 'f' : 'm', pitch: 1.5, rate: 1.05 };
    if (look === L.dog) return { g: 'm', pitch: 1.3, rate: 1.1 };
    if (look && look.skirt) return { g: 'f', pitch: look === L.grandma ? 0.95 : 1.12, rate: look === L.grandma ? 0.88 : 1 };
    if (look === L.teacher || (look && look.beard)) return { g: 'm', pitch: 0.82, rate: 0.95 };
    return { g: 'm', pitch: 0.95, rate: 1 };
  }

  // 화면용 기호·이모지·한자 풀이 등을 읽기 좋게 정리
  function clean(t) {
    return String(t)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\s\/\s/g, ', ')
      .replace(/<[^>]+>/g, '')
      .replace(/\(\s*[\p{Script=Han}\s]+\)/gu, '')
      .replace(/\p{Script=Han}+/gu, '')
      .replace(/\p{Extended_Pictographic}|\p{Variation_Selector}|\p{Join_Control}/gu, '')
      .replace(/[「」『』"“”]/g, '')
      .replace(/[~—]/g, ' ')
      .replace(/\s\+\s/g, ' 더하기 ').replace(/\s=\s/g, ', ').replace(/·/g, ' ')
      .replace(/①/g, '1번, ').replace(/②/g, '2번, ').replace(/③/g, '3번, ').replace(/④/g, '4번, ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const off = () => !synth || !ko.length || (TT.state && TT.state.voiceOff);
  let lastText = '', lastSpk = null;

  // ----- 미리 녹음한 음성 파일 (Typecast·ElevenLabs 등으로 개발 중에 만든 MP3) -----
  // window.TT_VOICE_LINES (Typecast 본편 음성, audio/voice/lines.js) 를 먼저 찾고, 없으면 TT_VOICE_SAMPLES_EL 의 in_game 항목.
  // 대사 텍스트가 정확히 같으면 MP3를 재생하고, 파일이 없는 대사는 기존 브라우저 읽어주기로 그대로 읽는다. 게임 중 TTS API는 호출하지 않는다.
  // 나레이션(ui.narrate)도 화면 글자 그대로를 키로 찾는다. 플레이어 이름({name})이 들어간 대사는 이름을 빼고 녹음해 두었으므로
  // 이름 자리를 아무 글자로 보고 맞춘다.
  // say: 화면 글자와 따로 정한 읽기 텍스트(예: ㄱ → 기역). MP3를 못 불러올 때 브라우저 읽어주기가 이 문장으로 읽는다.
  let lineMap = null, nameLines = null;
  const lookup = text => {
    if (!lineMap) {
      lineMap = new Map();
      nameLines = [];
      const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const add = s => {
        const t = s.text.trim(), v = { audio: s.audio, say: s.say };
        if (t.includes('{name}')) nameLines.push(Object.assign({ re: new RegExp('^' + t.split('{name}').map(esc).join('.+?') + '$') }, v));
        else if (!lineMap.has(t)) lineMap.set(t, v);
      };
      (window.TT_VOICE_LINES || []).forEach(add);
      (window.TT_VOICE_SAMPLES_EL || []).filter(s => s.in_game).forEach(add);
    }
    const t = String(text).trim();
    return lineMap.get(t) || nameLines.find(n => n.re.test(t));
  };
  const recorded = text => { const hit = lookup(text); return hit && hit.audio; };
  const player = new Audio();
  player.preload = 'auto';
  player.addEventListener('ended', () => { speaking = false; if (TT.music) TT.music.duck(false); });

  TT.voice = {
    available: () => (!!synth && ko.length > 0) || !!(window.TT_VOICE_LINES || window.TT_VOICE_SAMPLES_EL || []).length,
    active: () => speaking,
    hasRecording: text => !!recorded(text),
    speak(text, spk, opts) {
      opts = opts || {};
      if (!opts.noRemember) { lastText = text; lastSpk = spk; }
      const hit = !opts.profile && !opts.forceSynth && lookup(text);
      const file = hit && hit.audio;
      if (file && !(TT.state && TT.state.voiceOff)) {
        if (synth) synth.cancel();
        player.pause();
        player.src = file;
        player.playbackRate = TT.state && TT.state.voiceSlow ? 0.85 : 1;
        speaking = true;
        if (TT.music) TT.music.duck(true);
        player.onerror = () => { speaking = false; player.onerror = null; this.speak(hit.say || text, spk, Object.assign({}, opts, { profile: profile(spk) })); };
        player.play().catch(() => { speaking = false; if (TT.music) TT.music.duck(false); });
        return;
      }
      player.pause();
      if (off()) return;
      const s = clean(text);
      if (!s) return;
      synth.cancel();
      const p = opts.profile || profile(spk);
      const u = new SpeechSynthesisUtterance(s);
      u.lang = 'ko-KR';
      const v = pick(p.g);
      if (v) u.voice = v;
      u.pitch = p.pitch;
      u.rate = p.rate * (TT.state && TT.state.voiceSlow ? 0.8 : 1);
      u.volume = 1;
      u.onstart = () => { speaking = true; if (TT.music) TT.music.duck(true); };
      u.onend = u.onerror = () => { speaking = false; if (TT.music) TT.music.duck(false); };
      synth.speak(u);
    },
    // 글자 공방에서 만든 소리를 읽어 줌
    syllable(syl) { this.speak(syl, null, { noRemember: true, profile: { g: 'f', pitch: 1.2, rate: 0.85 } }); },
    replay() { if (lastText) this.speak(lastText, lastSpk); },
    stop() { if (synth) synth.cancel(); player.pause(); speaking = false; if (TT.music) TT.music.duck(false); },
  };
})();
