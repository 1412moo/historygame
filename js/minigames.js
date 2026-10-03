// 미니게임: 한글 조합 퍼즐, 역사 퀴즈, 자격루(물시계) 조립
(function () {
  const TT = window.TT;
  const ui = TT.ui;

  // ================================================================= 한글 조합
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const compose = (TT.compose = (c, v) => String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28));
  const decompose = (TT.decompose = s => { const k = s.charCodeAt(0) - 0xac00; return [CHO[Math.floor(k / 588)], JUNG[Math.floor((k % 588) / 28)]]; });
  const HINT_C = {
    'ㄱ': 'ㄱ은 혀뿌리가 목구멍을 막는 모양이에요. "그~"',
    'ㄴ': 'ㄴ은 혀끝이 윗잇몸에 닿는 모양이에요. "느~"',
    'ㅁ': 'ㅁ은 입 모양을 본떴어요. 입술을 붙였다 떼며 "므~"',
    'ㅅ': 'ㅅ은 이(치아) 모양을 본떴어요. "스~"',
    'ㅇ': 'ㅇ은 목구멍 모양을 본떴어요.',
    'ㅂ': 'ㅂ은 ㅁ에 획을 더해 더 센 소리를 냈어요. "브~"',
    'ㄷ': 'ㄷ은 ㄴ에 획을 더한 글자예요. "드~"',
    'ㅎ': 'ㅎ은 ㅇ에 획을 더한 글자예요. "흐~"',
  };
  const HINT_V = {
    'ㅏ': 'ㅏ는 사람(ㅣ) 오른쪽에 하늘(·)이 붙은 모양. "아~"',
    'ㅜ': 'ㅜ는 땅(ㅡ) 아래에 하늘(·)이 붙은 모양. "우~"',
    'ㅣ': 'ㅣ는 서 있는 사람 모양. "이~"',
    'ㅗ': 'ㅗ는 땅(ㅡ) 위에 하늘(·)이 붙은 모양. "오~"',
    'ㅓ': 'ㅓ는 사람(ㅣ) 왼쪽에 하늘(·)이 붙은 모양. "어~"',
  };
  const ROUNDS = [
    { title: '첫 번째 비밀: 소리 합치기', intro: '자음 <b>ㄱ</b> 을 누르고, 모음 <b>ㅏ</b> 를 눌러 합쳐 보세요!', pic: '✨', word: '가', cons: ['ㄱ'], vows: ['ㅏ'], guide: true },
    { title: '그림 글자 만들기', intro: '그림의 이름을 글자로 만들어 보세요!', pic: '🌳', word: '나무', cons: ['ㄱ', 'ㄴ', 'ㅁ', 'ㅂ'], vows: ['ㅏ', 'ㅜ', 'ㅣ'] },
    { title: '그림 글자 만들기', intro: '이번엔 팔랑팔랑 날아다니는 친구!', pic: '🦋', word: '나비', cons: ['ㄴ', 'ㄷ', 'ㅂ', 'ㅅ'], vows: ['ㅏ', 'ㅗ', 'ㅣ'] },
    { title: '두 번째 비밀: 모음 바꾸기', intro: '<b>ㅁ</b> 하나로 세 가지 소리를! 모음만 바꿔 보세요.', pic: '👄', word: '마무미', cons: ['ㅁ'], vows: ['ㅏ', 'ㅗ', 'ㅜ', 'ㅣ'] },
    { title: '마지막 도전', intro: '세 글자에 도전! 노랗고 길쭉한 과일이에요.', pic: '🍌', word: '바나나', cons: ['ㄴ', 'ㄷ', 'ㅂ', 'ㅅ'], vows: ['ㅏ', 'ㅓ', 'ㅗ'] },
  ];
  const CHEERS = ['딩동댕!', '좋아요!', '멋져요!', '바로 그 소리!', '정답!'];

  TT.hangulGame = function () {
    return new Promise(resolve => {
      const found = new Set();
      let round = 0;
      const m = ui.modal('<div class="panel mg hangul"></div>', 'wide');
      const root = m.querySelector('.hangul');

      function renderRound() {
        const R = ROUNDS[round];
        const word = [...R.word];
        let idx = 0, selC = null, selV = null, wrong = 0, busy = false;
        root.innerHTML = `
          <div class="mg-top"><div class="mg-title">🔤 집현전 글자 공방</div>
            <div class="mg-dots">${ROUNDS.map((_, i) => `<span class="${i < round ? 'done' : i === round ? 'now' : ''}"></span>`).join('')}</div>
            <div class="mg-found">만든 소리 <b>${found.size}</b>개</div></div>
          <div class="hg-title">${R.title}</div>
          <div class="hg-target"><div class="hg-pic">${R.pic}</div>
            <div class="hg-slots">${word.map(ch => `<div class="slot"><span class="ghost">${ch}</span></div>`).join('')}</div></div>
          <div class="hg-msg">${R.intro}</div>
          <div class="hg-forge"><div class="fg fc">?</div><span class="op">+</span><div class="fg fv">?</div><span class="op">=</span><div class="fg fr"></div></div>
          <div class="hg-label">자음 (닿소리)</div>
          <div class="hg-row cons">${R.cons.map(ch => `<button class="tile c" data-ch="${ch}">${ch}</button>`).join('')}</div>
          <div class="hg-label">모음 (홀소리)</div>
          <div class="hg-row vows">${R.vows.map(ch => `<button class="tile v" data-ch="${ch}">${ch}</button>`).join('')}</div>
          <div class="hg-found">${[...found].map(s => `<span>${s}</span>`).join('')}</div>`;
        const slots = root.querySelectorAll('.slot');
        const msg = root.querySelector('.hg-msg');
        TT.voice.speak(`${R.title}. ${R.intro}`, null, { noRemember: true });
        const fc = root.querySelector('.fc'), fv = root.querySelector('.fv'), fr = root.querySelector('.fr');
        const tiles = [...root.querySelectorAll('.tile')];
        const markCurrent = () => slots.forEach((s, i) => s.classList.toggle('current', i === idx));
        markCurrent();
        const glowAnswer = () => {
          const [c, v] = decompose(word[idx]);
          tiles.forEach(t => t.classList.toggle('glow', t.dataset.ch === c || t.dataset.ch === v));
        };
        if (R.guide) glowAnswer();

        tiles.forEach(t => (t.onclick = () => {
          if (busy) return;
          TT.sfx.blip();
          const isC = t.classList.contains('c');
          if (isC) { selC = selC === t.dataset.ch ? null : t.dataset.ch; } else { selV = selV === t.dataset.ch ? null : t.dataset.ch; }
          tiles.forEach(x => x.classList.toggle('sel', (x.classList.contains('c') && x.dataset.ch === selC) || (x.classList.contains('v') && x.dataset.ch === selV)));
          fc.textContent = selC || '?'; fv.textContent = selV || '?';
          fc.classList.toggle('on', !!selC); fv.classList.toggle('on', !!selV);
          fr.textContent = ''; fr.className = 'fg fr';
          if (selC && selV) combine();
        }));

        function combine() {
          busy = true;
          const syl = compose(selC, selV);
          fr.textContent = syl;
          void fr.offsetWidth;
          fr.className = 'fg fr pop';
          TT.sfx.pop();
          TT.voice.syllable(syl);
          const isNew = !found.has(syl);
          found.add(syl);
          root.querySelector('.mg-found b').textContent = found.size;
          if (isNew) { const sp = document.createElement('span'); sp.textContent = syl; sp.className = 'new'; root.querySelector('.hg-found').appendChild(sp); }
          setTimeout(() => {
            const target = word[idx];
            if (syl === target) {
              const slot = slots[idx];
              slot.innerHTML = `<span class="filled">${syl}</span>`;
              slot.classList.add('ok');
              TT.sfx.good();
              idx++; wrong = 0;
              tiles.forEach(t => t.classList.remove('glow'));
              if (idx >= word.length) return roundClear();
              msg.innerHTML = `<b class="good">${CHEERS[(Math.random() * CHEERS.length) | 0]}</b> 다음 글자 <b>'${word[idx]}'</b> 를 만들어 볼까요?`;
              if (R.guide) glowAnswer();
            } else {
              wrong++;
              TT.sfx.bad();
              fr.classList.add('shake');
              const [tc, tv] = decompose(target);
              const [gc, gv] = decompose(syl);
              let hint = `<b>'${syl}'</b> 소리가 났어요! 우리가 만들 글자는 <b>'${target}'</b>.`;
              if (gc !== tc && gv === tv) hint += ` 모음은 맞았어요! 자음을 바꿔 볼까요?`;
              else if (gc === tc && gv !== tv) hint += ` 자음은 맞았어요! 모음을 바꿔 볼까요?`;
              if (wrong >= 2) { hint += `<br><small>💡 ${gc !== tc ? HINT_C[tc] || '' : HINT_V[tv] || ''}</small>`; glowAnswer(); }
              msg.innerHTML = hint;
            }
            selC = selV = null;
            tiles.forEach(x => x.classList.remove('sel'));
            setTimeout(() => { fc.textContent = '?'; fv.textContent = '?'; fc.classList.remove('on'); fv.classList.remove('on'); busy = false; }, 250);
          }, 520);
        }

        function roundClear() {
          busy = true;
          tiles.forEach(x => x.classList.remove('sel', 'glow'));
          root.querySelector('.hg-pic').classList.add('bounce');
          let extra = '';
          if (round === 0) extra = '자음과 모음을 합치면 하나의 소리(글자)가 돼요!';
          else if (round === 3) extra = 'ㅁ은 그대로인데 모음만 바꾸니 <b>마 · 무 · 미</b>! 이게 바로 훈민정음의 비밀이에요.';
          else extra = `<b>${R.word}</b> 완성! ${R.pic}`;
          msg.innerHTML = `<b class="good">🎉 ${extra}</b>`;
          TT.sfx.reward();
          const btn = document.createElement('button');
          btn.className = 'primary big';
          btn.textContent = round < ROUNDS.length - 1 ? '다음 ▶' : '공방 완료!';
          btn.onclick = () => { TT.sfx.select(); round++; round < ROUNDS.length ? renderRound() : finish(); };
          const row = document.createElement('div'); row.className = 'row'; row.appendChild(btn);
          msg.after(row);
        }
      }

      function finish() {
        root.innerHTML = `<div class="mg-end">
          <div class="big-emo">📜</div>
          <h2>훈민정음의 비밀을 하나 알아냈습니다!</h2>
          <p>자음과 모음을 <b>합치면</b> 소리가 돼요.<br>모음만 바꿔도 새로운 소리가 생겨요.<br>그래서 <b>몇 개의 글자만 익히면 수많은 말을 적을 수 있어요!</b></p>
          <p class="found-big">오늘 만든 소리: <b>${found.size}</b>개<br><span class="hg-found">${[...found].map(s => `<span>${s}</span>`).join('')}</span></p>
          <div class="row"><button class="primary big">학자님께 알려 드리기</button></div></div>`;
        root.querySelector('.primary').onclick = () => { TT.sfx.select(); ui.closeModal(); resolve(found.size); };
      }
      renderRound();
    });
  };

  // ================================================================= 받침 있는 글자 (종성부용초성)
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const compose3 = (c, v, j) => String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28 + Math.max(0, JONG.indexOf(j)));
  const decompose3 = s => { const k = s.charCodeAt(0) - 0xac00; return [CHO[Math.floor(k / 588)], JUNG[Math.floor((k % 588) / 28)], JONG[k % 28]]; };
  const BELOW = new Set(['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']);
  const HINT_J = {
    'ㅁ': '받침 ㅁ: 입술을 꾹 닫으며 끝나요. "곰, 감"',
    'ㄹ': '받침 ㄹ: 혀끝을 윗잇몸에 대고 소리를 굴려요. "달, 별"',
    'ㄴ': '받침 ㄴ: 혀끝이 윗잇몸에 닿은 채 코로 울려요. "간, 한"',
    'ㅇ': '받침 ㅇ: 목구멍 쪽에서 "응~" 하고 울려요. "강"',
    'ㄱ': '받침 ㄱ: 혀뿌리가 목구멍을 막으며 끝나요. "각"',
  };
  const PART = { cho: '첫소리', jung: '가운뎃소리', jong: '받침' };
  const BROUNDS = [
    { title: '세 번째 비밀: 받침', intro: '<b>ㄱ</b> → <b>ㅗ</b> → 받침 <b>ㅁ</b> 순서로 눌러 보세요!', pic: '🐻', word: '곰', cons: ['ㄱ', 'ㅁ'], vows: ['ㅗ'], guide: true },
    { title: '받침 글자 만들기', intro: '밤하늘에 둥실 떠 있는 것!', pic: '🌙', word: '달', cons: ['ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'], vows: ['ㅏ', 'ㅗ'] },
    { title: '받침 글자 만들기', intro: '반짝반짝 빛나는 것! 새 모음 <b>ㅕ</b>가 나왔어요.', pic: '⭐', word: '별', cons: ['ㄴ', 'ㄹ', 'ㅁ', 'ㅂ'], vows: ['ㅏ', 'ㅓ', 'ㅕ'] },
    { title: '받침만 바꾸기', intro: '<b>가</b>는 그대로! 받침만 바꿔서 네 가지 소리를 만들어요.', pic: '🔁', word: '각간감강', cons: ['ㄱ', 'ㄴ', 'ㅁ', 'ㅇ'], vows: ['ㅏ'] },
    { title: '마지막 도전', intro: '우리가 쓰는 글자의 이름! 두 글자 모두 받침이 있어요.', pic: '📜', word: '한글', cons: ['ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅎ'], vows: ['ㅏ', 'ㅗ', 'ㅡ'] },
  ];

  TT.batchimGame = function () {
    return new Promise(resolve => {
      const found = new Set();
      let round = 0, reuseShown = false;
      const m = ui.modal('<div class="panel mg hangul batchim"></div>', 'wide');
      const root = m.querySelector('.batchim');

      function renderRound() {
        const R = BROUNDS[round];
        const word = [...R.word];
        let idx = 0, wrong = 0, busy = false;
        const sel = { cho: null, jung: null, jong: null };
        root.innerHTML = `
          <div class="mg-top"><div class="mg-title">🔡 받침 글자 공방</div>
            <div class="mg-dots">${BROUNDS.map((_, i) => `<span class="${i < round ? 'done' : i === round ? 'now' : ''}"></span>`).join('')}</div>
            <div class="mg-found">만든 글자 <b>${found.size}</b>개</div></div>
          <div class="hg-title">${R.title}</div>
          <div class="hg-target"><div class="hg-pic">${R.pic}</div>
            <div class="hg-slots">${word.map(ch => `<div class="slot"><span class="ghost">${ch}</span></div>`).join('')}</div></div>
          <div class="hg-msg">${R.intro}</div>
          <div class="bc-forge">
            <div class="bc-block v-right"><div class="bs cho"><small>첫소리</small><span>?</span></div><div class="bs jung"><small>가운뎃소리</small><span>?</span></div><div class="bs jong"><small>받침</small><span>?</span></div></div>
            <span class="op">=</span><div class="fg fr"></div>
            <button class="bc-reset" title="다시">↺</button>
          </div>
          <div class="hg-label">자음 (첫소리 · 받침에 모두 써요)</div>
          <div class="hg-row cons">${R.cons.map(ch => `<button class="tile c" data-ch="${ch}">${ch}</button>`).join('')}</div>
          <div class="hg-label">모음 (가운뎃소리)</div>
          <div class="hg-row vows">${R.vows.map(ch => `<button class="tile v" data-ch="${ch}">${ch}</button>`).join('')}</div>
          <div class="hg-found">${[...found].map(s => `<span>${s}</span>`).join('')}</div>`;
        const slots = root.querySelectorAll('.slot'), msg = root.querySelector('.hg-msg');
        TT.voice.speak(`${R.title}. ${R.intro}`, null, { noRemember: true });
        const block = root.querySelector('.bc-block'), fr = root.querySelector('.fr');
        const tiles = [...root.querySelectorAll('.tile')];
        const active = () => (!sel.cho ? 'cho' : !sel.jung ? 'jung' : !sel.jong ? 'jong' : null);
        function paint() {
          ['cho', 'jung', 'jong'].forEach(k => {
            const el = block.querySelector('.' + k);
            el.querySelector('span').textContent = sel[k] || '?';
            el.classList.toggle('on', !!sel[k]);
            el.classList.toggle('active', active() === k);
          });
          block.classList.toggle('v-below', BELOW.has(sel.jung));
          block.classList.toggle('v-right', !BELOW.has(sel.jung));
        }
        const markCurrent = () => slots.forEach((s, i) => s.classList.toggle('current', i === idx));
        const glow = () => { const [c, v, j] = decompose3(word[idx]); tiles.forEach(t => t.classList.toggle('glow', [c, v, j].includes(t.dataset.ch))); };
        const reset = () => { sel.cho = sel.jung = sel.jong = null; fr.textContent = ''; fr.className = 'fg fr'; paint(); };
        markCurrent(); paint();
        if (R.guide) glow();
        root.querySelector('.bc-reset').onclick = () => { if (!busy) { TT.sfx.blip(); reset(); } };

        tiles.forEach(t => (t.onclick = () => {
          if (busy) return;
          TT.sfx.blip();
          const ch = t.dataset.ch;
          if (t.classList.contains('v')) sel.jung = ch;
          else if (active() === 'jong') {
            sel.jong = ch;
            if (!reuseShown) { reuseShown = true; ui.toast('💡 첫소리에 쓰던 자음을 받침에 다시 썼어요!'); }
          } else sel.cho = ch;
          paint();
          if (sel.cho && sel.jung && sel.jong) combine();
        }));

        function combine() {
          busy = true;
          const syl = compose3(sel.cho, sel.jung, sel.jong);
          fr.textContent = syl; void fr.offsetWidth; fr.className = 'fg fr pop';
          TT.sfx.pop();
          TT.voice.syllable(syl);
          if (!found.has(syl)) {
            found.add(syl);
            root.querySelector('.mg-found b').textContent = found.size;
            const sp = document.createElement('span'); sp.textContent = syl; sp.className = 'new'; root.querySelector('.hg-found').appendChild(sp);
          }
          setTimeout(() => {
            const target = word[idx];
            if (syl === target) {
              slots[idx].innerHTML = `<span class="filled">${syl}</span>`;
              slots[idx].classList.add('ok');
              TT.sfx.good();
              idx++; wrong = 0;
              tiles.forEach(t => t.classList.remove('glow'));
              if (idx >= word.length) return roundClear();
              markCurrent();
              msg.innerHTML = `<b class="good">${CHEERS[(Math.random() * CHEERS.length) | 0]}</b> 다음 글자 <b>'${word[idx]}'</b> 를 만들어 볼까요?`;
            } else {
              wrong++;
              TT.sfx.bad();
              fr.classList.add('shake');
              const tp = decompose3(target), gp = [sel.cho, sel.jung, sel.jong];
              const keys = ['cho', 'jung', 'jong'];
              const bad = keys.filter((k, i) => tp[i] !== gp[i]);
              const good = keys.filter((k, i) => tp[i] === gp[i]);
              let h = `<b>'${syl}'</b> 소리가 났어요! 만들 글자는 <b>'${target}'</b>.`;
              const jw = w => (w.charCodeAt(w.length - 1) - 0xac00) % 28 > 0;
              const gw = good.map(k => PART[k]).join('·'), bw = bad.map(k => PART[k]).join('·');
              if (good.length) h += ` ${gw}${jw(gw) ? '은' : '는'} 맞았어요! <b>${bw}</b>${jw(bw) ? '을' : '를'} 바꿔 볼까요?`;
              if (wrong >= 2) {
                const k = bad[0], i = keys.indexOf(k);
                const tip = k === 'jong' ? HINT_J[tp[2]] : k === 'cho' ? HINT_C[tp[0]] : HINT_V[tp[1]];
                if (tip) h += `<br><small>💡 ${tip}</small>`;
                glow();
              }
              msg.innerHTML = h;
            }
            setTimeout(() => { reset(); busy = false; }, 300);
          }, 520);
        }

        function roundClear() {
          busy = true;
          tiles.forEach(x => x.classList.remove('glow'));
          root.querySelector('.hg-pic').classList.add('bounce');
          const extra = round === 3 ? '<b>가</b>는 그대로인데 받침만 바꾸니 <b>각 · 간 · 감 · 강</b>! 받침이 소리를 바꿔요.'
            : round === 4 ? '<b>한글</b> 완성! 📜 받침까지 모두 해냈어요!' : `<b>${R.word}</b> 완성! ${R.pic}`;
          msg.innerHTML = `<b class="good">🎉 ${extra}</b>`;
          TT.sfx.reward();
          const row = document.createElement('div'); row.className = 'row';
          const btn = document.createElement('button'); btn.className = 'primary big';
          btn.textContent = round < BROUNDS.length - 1 ? '다음 ▶' : '공방 완료!';
          btn.onclick = () => { TT.sfx.select(); round++; round < BROUNDS.length ? renderRound() : finish(); };
          row.appendChild(btn); msg.after(row);
        }
      }
      function finish() {
        root.innerHTML = `<div class="mg-end"><div class="big-emo">🔡</div>
          <h2>받침의 비밀을 알아냈어요!</h2>
          <p>받침(끝소리)은 <b>첫소리에 쓰던 자음을 다시 써요.</b><br>그래서 새 글자를 더 만들지 않아도 돼요. <small>(종성부용초성)</small></p>
          <p>첫소리 + 가운뎃소리 + 받침을 <b>한 덩어리로 모아 쓰면</b> 곰, 달, 별, 한글!</p>
          <p class="found-big">오늘 만든 글자: <b>${found.size}</b>개<br><span class="hg-found">${[...found].map(s => `<span>${s}</span>`).join('')}</span></p>
          <div class="row"><button class="primary big">학자님께 보여 드리기</button></div></div>`;
        root.querySelector('.primary').onclick = () => { TT.sfx.select(); ui.closeModal(); resolve(found.size); };
      }
      renderRound();
    });
  };

  // ================================================================= 퀴즈
  TT.quiz = function (questions, title) {
    return new Promise(resolve => {
      let qi = 0, firstTry = 0;
      const m = ui.modal('<div class="panel quiz"></div>', 'wide');
      const root = m.querySelector('.quiz');
      const marks = ['①', '②', '③', '④'];
      function show() {
        const q = questions[qi];
        let tried = false;
        root.innerHTML = `<div class="mg-top"><div class="mg-title">${title || '📝 역사 퀴즈'}</div><div class="mg-found">문제 ${qi + 1} / ${questions.length}</div></div>
          <h2 class="q">Q. ${q.q}</h2>
          <div class="opts">${q.opts.map((o, i) => `<button class="opt" data-key="${i + 1}" data-i="${i}"><span class="mk">${marks[i]}</span> ${o}</button>`).join('')}</div>
          <div class="explain hidden"></div>`;
        const ex = root.querySelector('.explain');
        TT.voice.speak(`${q.q} ${q.opts.map((o, i) => `${i + 1}번, ${o}`).join('. ')}`, null, { noRemember: true });
        root.querySelectorAll('.opt').forEach(b => (b.onclick = () => {
          if (b.disabled) return;
          const i = +b.dataset.i;
          if (i === q.a) {
            if (!tried) firstTry++;
            TT.sfx.good();
            b.classList.add('right');
            root.querySelectorAll('.opt').forEach(x => (x.disabled = true));
            ex.className = 'explain good';
            ex.innerHTML = `<b>⭕ 정답이에요!</b><br>${q.why}<div class="row"><button class="primary big">${qi < questions.length - 1 ? '다음 문제 ▶' : '퀴즈 끝!'}</button></div>`;
            TT.voice.speak(`정답이에요! ${q.why}`, null, { noRemember: true });
            ex.querySelector('.primary').onclick = () => { TT.sfx.select(); qi++; qi < questions.length ? show() : done(); };
          } else {
            tried = true;
            TT.sfx.bad();
            b.classList.add('wrong'); b.disabled = true;
            ex.className = 'explain retry';
            ex.innerHTML = `<b>🤔 다시 한번 떠올려 볼까요?</b><br>${q.hint}<div class="row"><button class="primary">다시 골라 보기</button></div>`;
            TT.voice.speak(`다시 한번 떠올려 볼까요? ${q.hint}`, null, { noRemember: true });
            ex.querySelector('.primary').onclick = () => { TT.sfx.blip(); TT.voice.stop(); ex.className = 'explain hidden'; };
          }
        }));
      }
      function done() { ui.closeModal(); resolve(firstTry); }
      show();
    });
  };

  // ================================================================= 자격루
  const svgJar = (s, label) => `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="92" rx="${30 * s}" ry="5" fill="rgba(0,0,0,.18)"/>
    <path d="M${50 - 22 * s} ${30} Q${50 - 40 * s} ${60} ${50 - 24 * s} 90 L${50 + 24 * s} 90 Q${50 + 40 * s} 60 ${50 + 22 * s} 30 Z" fill="#7a4526"/>
    <path d="M${50 - 16 * s} 40 Q${50 - 28 * s} 62 ${50 - 18 * s} 82" stroke="#9c6038" stroke-width="5" fill="none"/>
    <rect x="${50 - 25 * s}" y="22" width="${50 * s}" height="10" rx="4" fill="#5a3218"/>
    <ellipse class="wtop" cx="50" cy="27" rx="${20 * s}" ry="4" fill="#4ea4e2"/>
    <rect x="${50 + 26 * s}" y="70" width="14" height="5" fill="#5a3218"/></svg>`;
  const PARTS = {
    big: { name: '큰 물항아리', desc: '물을 가득 담아 둬요', svg: svgJar(1.05) },
    small: { name: '작은 물항아리', desc: '물이 일정하게 흐르게 해요', svg: svgJar(0.7) },
    rod: { name: '잣대 물통', desc: '물이 차면 잣대가 떠올라요', svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="94" rx="24" ry="4" fill="rgba(0,0,0,.18)"/>
      <rect class="rodstick" x="46" y="2" width="8" height="70" rx="2" fill="#e8c14a" stroke="#9a7420" stroke-width="2"/>
      <rect x="30" y="20" width="40" height="72" rx="4" fill="#7a5230"/><rect x="34" y="24" width="32" height="64" fill="#3b2a1d"/>
      <rect class="lvl" x="34" y="78" width="32" height="10" fill="#4ea4e2"/>
      <rect x="30" y="20" width="40" height="6" fill="#5a3a20"/></svg>` },
    doll: { name: '시보 인형', desc: '종을 쳐서 시간을 알려요', svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="94" rx="30" ry="4" fill="rgba(0,0,0,.18)"/>
      <rect x="18" y="78" width="64" height="14" rx="3" fill="#8b5a2e"/>
      <path d="M30 78 L36 48 L52 48 L58 78 Z" fill="#c8302c"/><circle cx="44" cy="38" r="11" fill="#f3d3ad"/>
      <ellipse cx="44" cy="30" rx="12" ry="6" fill="#222"/><circle cx="40" cy="38" r="1.6" fill="#222"/><circle cx="48" cy="38" r="1.6" fill="#222"/>
      <g class="arm"><rect x="52" y="52" width="20" height="5" rx="2" fill="#c8302c"/><rect x="68" y="44" width="4" height="16" fill="#6e3f1d"/></g>
      <path d="M74 50 Q84 50 86 68 L66 68 Q68 50 74 50Z" fill="#d9a441" stroke="#9a7420" stroke-width="2" class="bellshape"/><circle cx="76" cy="70" r="3" fill="#9a7420"/></svg>` },
  };
  const ANSWER = ['big', 'small', 'rod', 'doll'];
  const SLOTPOS = [{ l: 3, t: 4 }, { l: 27, t: 20 }, { l: 51, t: 34 }, { l: 75, t: 46 }];

  TT.waterClockGame = function () {
    return new Promise(resolve => {
      const placed = [null, null, null, null];
      let selected = null, running = false;
      const order = ['rod', 'doll', 'big', 'small'];
      const m = ui.modal(`<div class="panel mg wc">
        <div class="mg-top"><div class="mg-title">⏰ 물시계 조립하기</div><div class="mg-found">장영실의 작업장</div></div>
        <div class="wc-msg">물은 <b>높은 곳에서 낮은 곳으로</b> 흘러요. 물이 흐르는 순서대로 ①~④ 자리에 부품을 놓아 주세요.<br><small>부품을 누르고 → 놓을 자리를 누르세요</small></div>
        <div class="wc-stage">
          ${[0, 1, 2].map(i => { const a = SLOTPOS[i], b = SLOTPOS[i + 1]; return `<div class="pipe" id="pipe${i}" style="left:${a.l + 18}%;top:${a.t + 14}%;width:${b.l + 11 - (a.l + 18)}%;height:${b.t + 6 - (a.t + 14)}%"><i class="ball"></i></div>`; }).join('')}
          ${SLOTPOS.map((p, i) => `<div class="wslot" data-i="${i}" style="left:${p.l}%;top:${p.t}%"><span class="num">${'①②③④'[i]}</span><div class="inner"></div></div>`).join('')}
          <div class="wc-time hidden">🔔 댕~! <b>오시(午時)</b>를 알립니다!</div>
        </div>
        <div class="wc-tray">${order.map(id => `<button class="part" data-id="${id}">${PARTS[id].svg}<b>${PARTS[id].name}</b><small>${PARTS[id].desc}</small></button>`).join('')}</div>
        <div class="row"><button class="primary big" id="wc-run" disabled>💧 물 흘려보내기</button></div></div>`, 'wide');
      const stage = m.querySelector('.wc-stage');
      const msg = m.querySelector('.wc-msg');
      const runBtn = m.querySelector('#wc-run');
      const slots = [...m.querySelectorAll('.wslot')];
      const parts = [...m.querySelectorAll('.part')];

      function refresh() {
        slots.forEach((s, i) => {
          const id = placed[i];
          s.querySelector('.inner').innerHTML = id ? `${PARTS[id].svg}<b>${PARTS[id].name}</b>` : '<span class="q">?</span>';
          s.classList.toggle('filled', !!id);
          s.classList.toggle('target', !!selected && !running);
        });
        parts.forEach(p => {
          const used = placed.includes(p.dataset.id);
          p.classList.toggle('used', used);
          p.classList.toggle('sel', p.dataset.id === selected);
        });
        runBtn.disabled = running || placed.some(x => !x);
      }
      parts.forEach(p => (p.onclick = () => {
        if (running) return;
        const id = p.dataset.id;
        TT.sfx.blip();
        if (placed.includes(id)) { placed[placed.indexOf(id)] = null; selected = id; }
        else selected = selected === id ? null : id;
        refresh();
      }));
      slots.forEach(s => (s.onclick = () => {
        if (running) return;
        const i = +s.dataset.i;
        if (selected) {
          const prev = placed.indexOf(selected);
          if (prev >= 0) placed[prev] = null;
          placed[i] = selected; selected = null;
          TT.sfx.pop();
        } else if (placed[i]) { selected = placed[i]; placed[i] = null; TT.sfx.blip(); }
        refresh();
      }));

      const wait = ms => new Promise(r => setTimeout(r, ms));
      const FAIL = [
        got => got === 'small' ? '앗, 작은 항아리는 물이 금방 바닥나 버려요! 맨 위 ①에는 물을 <b>많이</b> 담아 둘 큰 항아리가 있어야 해요.' : '앗, 물이 나오지 않아요! 물은 위에서 아래로 흘러요. 맨 위 ①에는 물을 담아 둘 <b>항아리</b>가 있어야 해요.',
        () => '물이 너무 세차게 쏟아져서 시간이 들쭉날쭉해요! 큰 항아리 다음 ②에는 물이 <b>일정하게</b> 흐르도록 작은 항아리를 놓아요.',
        () => '물이 고이기만 하고 아무 일도 안 일어나요. ③에는 물이 차오르면 <b>잣대(막대)</b>가 떠오르는 물통이 필요해요!',
        () => '잣대가 구슬을 굴렸는데 받을 것이 없어요. 마지막 ④에는 종을 치는 <b>시보 인형</b>!',
      ];
      runBtn.onclick = async () => {
        running = true; selected = null; refresh();
        stage.querySelectorAll('.pipe').forEach(p => p.classList.remove('flow', 'roll'));
        slots.forEach(s => s.classList.remove('bad', 'good', 'active'));
        msg.innerHTML = '💧 물을 부어 볼까요...';
        for (let i = 0; i < 4; i++) {
          const s = slots[i];
          s.classList.add('active');
          if (placed[i] !== ANSWER[i]) {
            await wait(500);
            s.classList.add('bad');
            TT.sfx.bad();
            msg.innerHTML = `<span class="bad">💦 ${FAIL[i](placed[i])}</span>`;
            const b = document.createElement('button');
            b.className = 'primary'; b.textContent = '다시 맞춰 보기';
            b.onclick = () => { slots.forEach(x => x.classList.remove('bad', 'good', 'active')); stage.querySelectorAll('.pipe').forEach(p => p.classList.remove('flow', 'roll')); stage.classList.remove('rise'); running = false; msg.innerHTML = '부품을 다시 놓아 보세요. 부품을 누르면 다른 자리로 옮길 수 있어요.'; refresh(); };
            msg.appendChild(document.createElement('br')); msg.appendChild(b);
            return;
          }
          s.classList.add('good');
          if (i < 3) {
            TT.sfx.water();
            if (i === 2) {
              stage.classList.add('rise');
              msg.innerHTML = '물이 차오르자 잣대가 스르륵 떠올라요...';
              await wait(1300);
              stage.querySelector('#pipe2').classList.add('roll');
              msg.innerHTML = '잣대가 구슬을 톡! 구슬이 데구루루 굴러가요...';
              await wait(1100);
            } else {
              stage.querySelector('#pipe' + i).classList.add('flow');
              msg.innerHTML = i === 0 ? '큰 항아리의 물이 흘러내려요...' : '작은 항아리를 지나 물이 똑, 똑, 일정하게 흘러요...';
              await wait(1100);
            }
          } else {
            stage.classList.add('ring');
            TT.sfx.bell();
            stage.querySelector('.wc-time').classList.remove('hidden');
            msg.innerHTML = '<b class="good">🎉 성공! 인형이 종을 쳐서 시간을 알려요!</b>';
            await wait(1600);
            const b = document.createElement('button');
            b.className = 'primary big'; b.textContent = '장영실에게 보여 주기';
            b.onclick = () => { TT.sfx.select(); ui.closeModal(); resolve(); };
            msg.appendChild(document.createElement('br')); msg.appendChild(b);
          }
        }
      };
      refresh();
    });
  };

  // ================================================================= 앙부일구 방향 맞추기
  // 각도: SVG 기준(오른쪽 0°, 시계방향 증가). 장면의 북쪽 = 225°(왼쪽 위).
  const HOURS = [
    { e: '🐰', n: '묘시', t: '새벽 5~7시' }, { e: '🐉', n: '진시', t: '아침 7~9시' }, { e: '🐍', n: '사시', t: '오전 9~11시' },
    { e: '🐴', n: '오시', t: '한낮 11~13시' }, { e: '🐑', n: '미시', t: '오후 1~3시' }, { e: '🐒', n: '신시', t: '오후 3~5시' }, { e: '🐔', n: '유시', t: '저녁 5~7시' },
  ];
  TT.sundialGame = function () {
    return new Promise(resolve => {
      const NORTH = 225, GOAL = NORTH - 270; // 영침(바늘)은 다이얼 기준 270°(위쪽)
      const norm = a => ((a % 360) + 360) % 360;
      const pt = (a, r) => [Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r];
      let rot = 45, sun = NORTH + 180, locked = false, phase = 1;
      const lm = (a, r, icon, name) => { const [x, y] = pt(a, r); return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><text class="lm-i" y="-2">${icon}</text><text class="lm-t" y="15">${name}</text></g>`; };
      const m = ui.modal(`<div class="panel mg sundial">
        <div class="mg-top"><div class="mg-title">☀️ 앙부일구 고치기</div><div class="mg-dots"><span class="now"></span><span></span></div><div class="mg-found">⭐ 보너스 미션</div></div>
        <div class="sd-msg">수레에 부딪혀 해시계가 돌아갔어요! 지금은 해가 남쪽 하늘 가장 높이 뜬 <b>한낮</b>인데, 그림자는 엉뚱한 시각을 가리켜요.<br><b>바늘(영침)이 북쪽 북악산을 향하도록</b> 해시계를 돌려 보세요.</div>
        <div class="sd-stage">
          <svg viewBox="-160 -160 320 320">
            <circle r="156" class="ground"/>
            ${lm(NORTH, 136, '⛰️', '북악산 (북쪽)')}${lm(NORTH, 104, '🏯', '궁궐')}${lm(NORTH + 180, 138, '🌲', '남산 (남쪽)')}
            <g class="dial">
              <circle r="80" class="rim"/><circle r="70" class="bowl"/>
              <circle r="46" class="arc"/><circle r="26" class="arc"/>
              ${HOURS.map((h, k) => { const a = 180 + 30 * k; const [x1, y1] = pt(a, 70); const [ex, ey] = pt(a, 58); const [nx, ny] = pt(a, 38); return `<line x1="0" y1="0" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="hl"/><g class="hlab" data-k="${k}"><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="11" class="hbg"/><text x="${ex.toFixed(1)}" y="${ey.toFixed(1)}" class="he">${h.e}</text><text x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" class="hn">${h.n[0]}</text></g>`; }).join('')}
              <line x1="0" y1="0" x2="0" y2="-66" class="needle"/><circle cx="0" cy="-66" r="5" class="needle-tip"/><circle r="5" class="needle-base"/>
            </g>
            <line class="shadow" x1="0" y1="0" x2="0" y2="0"/>
            <text class="sun">☀️</text>
          </svg>
        </div>
        <div class="sd-read"></div>
        <div class="sd-ctrl"><button class="big" id="sd-l">⟲ 왼쪽으로</button><button class="big" id="sd-r">오른쪽으로 ⟳</button></div>
        <div class="sd-result"></div></div>`, 'wide');
      const svg = m.querySelector('svg'), dial = m.querySelector('.dial'), shadow = m.querySelector('.shadow'), sunEl = m.querySelector('.sun');
      const readEl = m.querySelector('.sd-read'), msg = m.querySelector('.sd-msg'), res = m.querySelector('.sd-result'), ctrl = m.querySelector('.sd-ctrl');
      const reading = () => {
        const rel = norm(sun + 180 - rot);
        const k = Math.round((rel - 180) / 30);
        return rel >= 165 && k >= 0 && k <= 6 ? k : -1;
      };
      function draw() {
        dial.setAttribute('transform', `rotate(${rot})`);
        const [sx, sy] = pt(sun, 112); sunEl.setAttribute('x', sx.toFixed(1)); sunEl.setAttribute('y', sy.toFixed(1));
        const [hx, hy] = pt(sun + 180, 64); shadow.setAttribute('x2', hx.toFixed(1)); shadow.setAttribute('y2', hy.toFixed(1));
        const k = reading();
        m.querySelectorAll('.hlab').forEach(g => g.classList.toggle('on', +g.dataset.k === k));
        if (phase === 1) readEl.innerHTML = k >= 0 ? `그림자가 가리키는 시각: <b>${HOURS[k].e} ${HOURS[k].n}</b> <small>(${HOURS[k].t})</small>` : '그림자가 눈금 밖으로 나갔어요!';
      }
      function turn(d) {
        if (locked) return;
        rot = norm(rot + d + 180) - 180;
        TT.sfx.blip(); draw();
        if (norm(rot - GOAL) === 0) aligned();
      }
      m.querySelector('#sd-l').onclick = () => turn(-15);
      m.querySelector('#sd-r').onclick = () => turn(15);
      // 끌어서 돌리기
      let drag = null;
      const ang = e => { const r = svg.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI; };
      svg.addEventListener('pointerdown', e => { if (locked) return; drag = { a: ang(e), rot }; svg.setPointerCapture(e.pointerId); });
      svg.addEventListener('pointermove', e => {
        if (!drag || locked) return;
        const nr = Math.round((drag.rot + ang(e) - drag.a) / 15) * 15;
        if (nr !== rot) { rot = norm(nr + 180) - 180; TT.sfx.blip(); draw(); if (norm(rot - GOAL) === 0) { drag = null; aligned(); } }
      });
      svg.addEventListener('pointerup', () => (drag = null));

      function aligned() {
        locked = true;
        svg.classList.add('ok');
        TT.sfx.good();
        ctrl.style.display = 'none';
        msg.innerHTML = `<b class="good">🎉 딱 맞았어요! 바늘이 북쪽 북악산을 가리키자, 그림자가 🐴 오시(한낮)를 가리켜요!</b>`;
        res.innerHTML = '';
        const b = document.createElement('button'); b.className = 'primary big'; b.textContent = '그림자로 시각 읽기 ▶';
        b.onclick = () => { TT.sfx.select(); phase = 2; m.querySelectorAll('.mg-dots span').forEach((s, i) => (s.className = i === 0 ? 'done' : 'now')); readRound(0); };
        const row = document.createElement('div'); row.className = 'row'; row.appendChild(b); res.appendChild(row);
      }
      function moveSun(to, ms) {
        return new Promise(r => {
          const from = sun, t0 = performance.now();
          let d = norm(to - from); if (d > 180) d -= 360;
          const step = now => { const p = Math.min(1, (now - t0) / ms); sun = from + d * (1 - Math.pow(1 - p, 3)); draw(); p < 1 ? requestAnimationFrame(step) : r(); };
          requestAnimationFrame(step);
        });
      }
      const READ = [{ k: 1, say: '다음 날 아침이 되었어요. 해가 동쪽 하늘에 떠 있어요.', opts: [1, 3, 5, 0] }, { k: 5, say: '해가 서쪽으로 기울어 가는 오후가 되었어요.', opts: [2, 6, 5, 3] }];
      async function readRound(i) {
        const R = READ[i];
        readEl.innerHTML = '';
        res.innerHTML = '';
        msg.innerHTML = `☀️ ${R.say}`;
        await moveSun(GOAL + 30 * R.k, 1600);
        msg.innerHTML = `☀️ ${R.say}<br><b>그림자 끝은 어떤 동물 그림을 가리키나요?</b>`;
        res.innerHTML = `<div class="row">${R.opts.map((k, j) => `<button class="big sd-opt" data-key="${j + 1}" data-k="${k}">${HOURS[k].e} ${HOURS[k].n}</button>`).join('')}</div><div class="sd-hint"></div>`;
        res.querySelectorAll('.sd-opt').forEach(b => (b.onclick = () => {
          const k = +b.dataset.k;
          if (k !== R.k) { TT.sfx.bad(); b.disabled = true; b.classList.add('wrong'); res.querySelector('.sd-hint').innerHTML = '<span class="bad">🤔 해시계 안쪽의 진한 그림자 막대를 따라가 보세요. 끝에 닿은 그림이 무엇인가요?</span>'; return; }
          TT.sfx.good();
          res.querySelectorAll('.sd-opt').forEach(x => (x.disabled = true));
          b.classList.add('right');
          res.querySelector('.sd-hint').innerHTML = `<b class="good">⭕ ${HOURS[k].e} ${HOURS[k].n}! 지금으로 치면 ${HOURS[k].t}예요.</b>`;
          const nb = document.createElement('button'); nb.className = 'primary big'; nb.textContent = i < READ.length - 1 ? '시간 더 흘려보내기 ▶' : '다 읽었어요!';
          nb.onclick = () => { TT.sfx.select(); i < READ.length - 1 ? readRound(i + 1) : finish(); };
          const row = document.createElement('div'); row.className = 'row'; row.appendChild(nb); res.appendChild(row);
        }));
      }
      function finish() {
        TT.sfx.reward();
        m.querySelector('.panel').innerHTML = `<div class="mg-end"><div class="big-emo">☀️🐴</div>
          <h2>앙부일구를 고쳤어요!</h2>
          <p>바늘(영침)이 <b>북쪽</b>을 향해야 그림자가 시각을 바르게 가리켜요.</p>
          <p>옛날에는 하루를 <b>열두 동물(12지)</b>로 나누었어요.<br>앙부일구에는 낮 시간의 동물 🐰🐉🐍🐴🐑🐒🐔 이 그려져 있어서<br><b>글을 몰라도 그림만 보고 시각을 알 수 있었어요!</b></p>
          <div class="row"><button class="primary big">완료!</button></div></div>`;
        m.querySelector('.primary').onclick = () => { TT.sfx.select(); ui.closeModal(); resolve(); };
      }
      draw();
    });
  };

  // ================================================================= 혼천의 조립 + 북극성 찾기
  const ARM = {
    base: { name: '받침대', sub: '나무 받침', clue: '무거운 고리들을 단단히 받쳐 줄 것', role: '고리들을 받치는 받침대',
      icon: '<path d="M20 70 L80 70 L72 86 L28 86Z" fill="#8b5a2e"/><rect x="44" y="40" width="12" height="32" fill="#6e3f1d"/>',
      draw: '<g class="ap"><path d="M90 268 L210 268 L196 290 L104 290Z" fill="#8b5a2e"/><rect x="141" y="236" width="18" height="34" fill="#6e3f1d"/><rect x="38" y="160" width="10" height="110" fill="#6e3f1d"/><rect x="252" y="160" width="10" height="110" fill="#6e3f1d"/><rect x="38" y="262" width="224" height="10" fill="#6e3f1d"/></g>' },
    horizon: { name: '지평환', sub: '수평 고리', clue: '땅의 끝(지평선)을 나타내는, 바닥과 나란한 고리', role: '땅(지평선)을 나타내는 고리',
      icon: '<ellipse cx="50" cy="55" rx="38" ry="12" fill="none" stroke="#c99a3a" stroke-width="7"/>',
      draw: '<g class="ap"><ellipse cx="150" cy="160" rx="110" ry="30" fill="none" stroke="#c99a3a" stroke-width="9"/></g>' },
    meridian: { name: '자오환', sub: '세로 고리', clue: '남쪽과 북쪽을 이으며 하늘 꼭대기를 지나는 세로 고리', role: '북극을 향해 남북을 잇는 고리',
      icon: '<circle cx="50" cy="50" r="34" fill="none" stroke="#b5882e" stroke-width="7"/><circle cx="50" cy="16" r="4" fill="#c8302c"/>',
      draw: '<g class="ap"><circle cx="150" cy="150" r="108" fill="none" stroke="#b5882e" stroke-width="9"/><circle cx="85" cy="64" r="6" fill="#c8302c"/></g>' },
    equator: { name: '적도환', sub: '기운 고리', clue: '해와 달이 지나가는 길을 나타내는, 비스듬히 기운 고리', role: '해와 달이 지나는 길을 나타내는 고리',
      icon: '<ellipse cx="50" cy="50" rx="38" ry="13" fill="none" stroke="#e0b44a" stroke-width="7" transform="rotate(-30 50 50)"/>',
      draw: '<g class="ap"><ellipse cx="150" cy="150" rx="96" ry="34" fill="none" stroke="#e0b44a" stroke-width="8" transform="rotate(-35 150 150)"/></g>' },
    tube: { name: '망통', sub: '관측 막대', clue: '별을 겨누어 들여다보는 가늘고 긴 관', role: '별을 겨누어 보는 관',
      icon: '<rect x="44" y="10" width="12" height="80" rx="3" fill="#5a3a14" transform="rotate(35 50 50)"/>',
      draw: '<g class="ap"><circle cx="150" cy="150" r="70" fill="none" stroke="#8a6a2a" stroke-width="5"/><rect x="143" y="62" width="14" height="176" rx="4" fill="#5a3a14" transform="rotate(35 150 150)"/><circle cx="150" cy="150" r="7" fill="#3a2410"/></g>' },
  };
  const ARM_ORDER = ['base', 'horizon', 'meridian', 'equator', 'tube'];

  TT.armillaryGame = function () {
    return new Promise(resolve => {
      const m = ui.modal('<div class="panel mg armillary"></div>', 'wide');
      const root = m.querySelector('.armillary');
      const head = (n, t) => `<div class="mg-top"><div class="mg-title">🔭 혼천의 조립</div><div class="mg-dots">${[0, 1].map(i => `<span class="${i < n ? 'done' : i === n ? 'now' : ''}"></span>`).join('')}</div><div class="mg-found">${t}</div></div>`;

      function assemble() {
        let idx = 0;
        const tray = ARM_ORDER.slice().sort(() => Math.random() - 0.5);
        root.innerHTML = `${head(0, '1. 조립하기')}
          <div class="arm-wrap">
            <svg class="arm-svg" viewBox="0 0 300 300">
              <g class="ghost"><circle cx="150" cy="150" r="108"/><ellipse cx="150" cy="160" rx="110" ry="30"/><ellipse cx="150" cy="150" rx="96" ry="34" transform="rotate(-35 150 150)"/><path d="M90 268 L210 268 L196 290 L104 290Z"/></g>
              <g class="placed"></g>
            </svg>
            <div class="arm-plan"><b>📜 설계도</b><ol>${ARM_ORDER.map((k, i) => `<li data-i="${i}">${ARM[k].clue}</li>`).join('')}</ol></div>
          </div>
          <div class="arm-msg">설계도 <b>1번</b>의 설명에 맞는 부품을 골라 보세요!</div>
          <div class="arm-tray">${tray.map(k => `<button class="arm-part" data-k="${k}"><svg viewBox="0 0 100 100">${ARM[k].icon}</svg><b>${ARM[k].name}</b><small>${ARM[k].sub}</small></button>`).join('')}</div>`;
        const msg = root.querySelector('.arm-msg'), placed = root.querySelector('.placed');
        const mark = () => root.querySelectorAll('.arm-plan li').forEach(li => { const i = +li.dataset.i; li.className = i < idx ? 'done' : i === idx ? 'now' : ''; });
        mark();
        root.querySelectorAll('.arm-part').forEach(b => (b.onclick = () => {
          const k = b.dataset.k, need = ARM_ORDER[idx];
          if (k !== need) {
            TT.sfx.bad();
            b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
            const jong = w => (w.charCodeAt(w.length - 1) - 0xac00) % 28 > 0;
            const nm = ARM[k].name, rl = ARM[k].role;
            let why = `<b>${nm}</b>${jong(nm) ? '은' : '는'} '${rl}'${jong(rl.replace(/[^가-힣]/g, '')) ? '이에요' : '예요'}.`;
            if (idx === 0) why += ' 고리를 올려놓으려면 먼저 받쳐 줄 것이 있어야 해요!';
            else if (k === 'tube') why += ' 망통은 고리들 맨 안쪽에서 돌아가며 별을 겨눠요. 바깥 고리부터 차례로!';
            else why += ` 설계도 <b>${idx + 1}번</b> 설명을 다시 읽어 볼까요?`;
            msg.innerHTML = `<span class="bad">🤔 ${why}</span>`;
            return;
          }
          TT.sfx.pop();
          placed.insertAdjacentHTML('beforeend', ARM[k].draw);
          b.disabled = true; b.classList.add('used');
          idx++; mark();
          if (idx < ARM_ORDER.length) {
            msg.innerHTML = `<b class="good">⭕ ${ARM[k].name} — ${ARM[k].role}!</b><br>다음은 설계도 <b>${idx + 1}번</b>이에요.`;
          } else {
            TT.sfx.reward();
            root.querySelector('.arm-svg').classList.add('done');
            msg.innerHTML = `<b class="good">🎉 혼천의 완성! 둥근 고리들은 하늘을, 가운데 망통은 별을 겨누는 눈이에요.</b>`;
            const r = document.createElement('div'); r.className = 'row';
            const nb = document.createElement('button'); nb.className = 'primary big'; nb.textContent = '🌙 밤하늘 관측하기 ▶';
            nb.onclick = () => { TT.sfx.select(); observe(); };
            r.appendChild(nb); msg.after(r);
          }
        }));
      }

      // 2단계: 망통으로 북극성 찾기
      function observe() {
        const DIP = [[250, 150], [262, 190], [305, 196], [300, 160], [330, 150], [356, 141], [382, 152]];
        const POL = [222, 56];
        const r = TT.rng(7);
        const bg = Array.from({ length: 70 }, () => `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 260).toFixed(0)}" r="${(0.6 + r() * 1.1).toFixed(1)}" fill="#fff" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`).join('');
        const cas = [[60, 70], [85, 95], [105, 72], [128, 98], [150, 76]];
        root.innerHTML = `${head(1, '2. 북극성 찾기')}
          <div class="arm-msg">🌙 밤이 되었어요. 망통으로 <b>북극성</b>을 찾아보세요!<br><small>💡 국자 모양 <b>북두칠성</b>의 끝 두 별(국자 머리)을 이어 쭉 따라가면 북극성이 있어요.</small></div>
          <div class="sky-wrap"><svg class="sky-svg" viewBox="0 0 400 260">
            <rect width="400" height="260" fill="#0e1838"/>${bg}
            <polyline points="${[6, 5, 4, 3, 0, 1, 2, 3].map(i => DIP[i].join(',')).join(' ')}" class="dip-line"/>
            ${DIP.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.2" class="star"/>`).join('')}
            ${cas.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" class="star"/>`).join('')}
            <circle cx="${POL[0]}" cy="${POL[1]}" r="3" class="star pol"/>
            <line class="hint-line" x1="262" y1="190" x2="${POL[0]}" y2="${POL[1]}"/>
            <path class="scope-mask" fill-rule="evenodd" d=""/>
            <circle class="scope-ring" r="34"/>
            <line class="cross" /><line class="cross2" />
          </svg></div>
          <div class="sky-ctrl"><button class="big" data-d="0,-20">▲</button><button class="big" data-d="-20,0">◀</button><button class="big" data-d="20,0">▶</button><button class="big" data-d="0,20">▼</button><button class="big" id="sky-hint">💡 힌트</button></div>
          <div class="sky-result"></div>`;
        const svg = root.querySelector('.sky-svg'), mask = root.querySelector('.scope-mask'), ring = root.querySelector('.scope-ring');
        const c1 = root.querySelector('.cross'), c2 = root.querySelector('.cross2'), res = root.querySelector('.sky-result');
        let sx = 90, sy = 200, found = false, dipSeen = false;
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
        function draw() {
          mask.setAttribute('d', `M0 0H400V260H0Z M${sx - 34} ${sy} a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0Z`);
          ring.setAttribute('cx', sx); ring.setAttribute('cy', sy);
          c1.setAttribute('x1', sx - 8); c1.setAttribute('x2', sx + 8); c1.setAttribute('y1', sy); c1.setAttribute('y2', sy);
          c2.setAttribute('y1', sy - 8); c2.setAttribute('y2', sy + 8); c2.setAttribute('x1', sx); c2.setAttribute('x2', sx);
          if (found) return;
          if (!dipSeen && DIP.some(p => Math.hypot(p[0] - sx, p[1] - sy) < 30)) {
            dipSeen = true; TT.sfx.blip();
            res.innerHTML = '✨ 국자 모양 별 일곱 개, <b>북두칠성</b>이에요! 국자 머리 끝 두 별을 이어서 위쪽으로 쭉 따라가 볼까요?';
          }
          if (Math.hypot(POL[0] - sx, POL[1] - sy) < 14) success();
        }
        function move(dx, dy) { if (found) return; sx = clamp(sx + dx, 20, 380); sy = clamp(sy + dy, 20, 240); draw(); }
        root.querySelectorAll('.sky-ctrl [data-d]').forEach(b => (b.onclick = () => { const [dx, dy] = b.dataset.d.split(',').map(Number); TT.sfx.blip(); move(dx, dy); }));
        root.querySelector('#sky-hint').onclick = () => { svg.classList.add('hint'); TT.sfx.select(); res.innerHTML = '💡 점선을 따라가 보세요! 북두칠성 국자 머리에서 위로 쭉 이어진 곳에 북극성이 있어요.'; };
        let drag = null;
        const toSvg = e => { const b = svg.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * 400, (e.clientY - b.top) / b.height * 260]; };
        svg.addEventListener('pointerdown', e => { drag = toSvg(e); svg.setPointerCapture(e.pointerId); const [x, y] = drag; sx = clamp(x, 20, 380); sy = clamp(y, 20, 240); if (!found) draw(); });
        svg.addEventListener('pointermove', e => { if (!drag || found) return; const [x, y] = toSvg(e); sx = clamp(x, 20, 380); sy = clamp(y, 20, 240); draw(); });
        svg.addEventListener('pointerup', () => (drag = null));
        function success() {
          found = true; drag = null;
          sx = POL[0]; sy = POL[1]; draw();
          svg.classList.add('found');
          TT.sfx.reward();
          res.innerHTML = `<b class="good">🌟 북극성을 찾았어요!</b><br>다른 별들은 밤새 북극성을 중심으로 빙 돌지만, 북극성은 거의 움직이지 않아요.<br>그래서 하늘을 관측하는 <b>기준</b>이 되었답니다.`;
          root.querySelector('.sky-ctrl').style.display = 'none';
          const r2 = document.createElement('div'); r2.className = 'row';
          const b = document.createElement('button'); b.className = 'primary big'; b.textContent = '관원에게 알려 주기';
          b.onclick = () => { TT.sfx.select(); ui.closeModal(); resolve(); };
          r2.appendChild(b); res.appendChild(r2);
        }
        draw();
      }
      assemble();
    });
  };

  // ================================================================= 측우기 실험
  const VESSELS = {
    bowl: { name: '넓은 사발', svg: `<svg viewBox="0 0 100 100"><path d="M8 34 Q50 34 92 34 Q84 78 50 80 Q16 78 8 34Z" fill="#d9c7a0" stroke="#8a6a45" stroke-width="3"/><ellipse cx="50" cy="34" rx="42" ry="7" fill="#efe2c4" stroke="#8a6a45" stroke-width="3"/><rect x="38" y="80" width="24" height="8" rx="2" fill="#8a6a45"/></svg>`,
      bad: '사발은 위는 넓고 아래는 좁아서, 물이 같은 양이라도 높이가 그릇 모양에 따라 달라져요. 얕아서 금방 넘치거나 말라 버리기도 해요!' },
    basket: { name: '대나무 바구니', svg: `<svg viewBox="0 0 100 100"><path d="M14 30 L86 30 L78 84 L22 84Z" fill="#d9b26a" stroke="#8a6a2a" stroke-width="3"/>${[40, 52, 64, 76].map(y => `<line x1="16" y1="${y}" x2="84" y2="${y}" stroke="#8a6a2a" stroke-width="2"/>`).join('')}${[30, 42, 54, 66].map(x => `<line x1="${x}" y1="30" x2="${x + 2}" y2="84" stroke="#8a6a2a" stroke-width="2"/>`).join('')}<ellipse cx="50" cy="30" rx="36" ry="5" fill="#e8c98a" stroke="#8a6a2a" stroke-width="3"/></svg>`,
      bad: '앗, 틈 사이로 빗물이 줄줄 새어 나가요! 물을 담을 수 없으면 잴 수도 없겠죠?' },
    cyl: { name: '원통 쇠그릇', svg: `<svg viewBox="0 0 100 100"><rect x="30" y="16" width="40" height="64" fill="#4f8f8a" stroke="#2d5f5b" stroke-width="3"/><ellipse cx="50" cy="16" rx="20" ry="5" fill="#244b48"/><rect x="34" y="20" width="6" height="56" fill="#6fb3ad"/><rect x="30" y="38" width="40" height="3" fill="#2d5f5b"/><rect x="30" y="60" width="40" height="3" fill="#2d5f5b"/><rect x="22" y="80" width="56" height="12" fill="#9d978b" stroke="#77716a" stroke-width="2"/></svg>` },
  };

  TT.rainGaugeGame = function () {
    return new Promise(resolve => {
      const m = ui.modal('<div class="panel mg rain"></div>', 'wide');
      const root = m.querySelector('.rain');
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const head = (n, title) => `<div class="mg-top"><div class="mg-title">🌧️ 측우기 실험</div>
        <div class="mg-dots">${[0, 1, 2].map(i => `<span class="${i < n ? 'done' : i === n ? 'now' : ''}"></span>`).join('')}</div>
        <div class="mg-found">${title}</div></div>`;
      const nextBtn = (label, fn) => { const r = document.createElement('div'); r.className = 'row'; const b = document.createElement('button'); b.className = 'primary big'; b.textContent = label; b.onclick = () => { TT.sfx.select(); fn(); }; r.appendChild(b); return r; };

      // 1단계: 같은 비, 다른 흙 → 땅으로 재는 방법의 문제 체험
      function phase1() {
        root.innerHTML = `${head(0, '1. 땅으로 재 보기')}
          <div class="rain-msg">🌧️ 어젯밤, 두 밭에 <b>똑같은 비</b>가 내렸어요.<br>관아에서 하던 대로 막대를 꽂아 빗물이 얼마나 스며들었는지 재 보세요!</div>
          <div class="soil-row">
            ${[['sand', '🏜️ 모래흙 밭', 4], ['clay', '🟫 진흙 밭', 1]].map(([k, t, d]) => `<div class="soil-card" data-k="${k}" data-d="${d}">
              <div class="soil-title">${t}</div>
              <div class="soil-box ${k}"><div class="grass"></div><div class="wet"></div><div class="stick"></div><div class="depth"></div></div>
              <button class="primary">📏 막대로 재기</button></div>`).join('')}
          </div><div class="rain-result"></div>`;
        const done = {};
        root.querySelectorAll('.soil-card').forEach(card => {
          const btn = card.querySelector('button');
          btn.onclick = async () => {
            btn.disabled = true; TT.sfx.blip();
            const d = +card.dataset.d;
            card.querySelector('.wet').style.height = (d / 5 * 82) + '%';
            card.querySelector('.stick').classList.add('in');
            await wait(900);
            card.querySelector('.depth').textContent = `${d}치 스며듦`;
            card.querySelector('.depth').classList.add('show');
            TT.sfx.pop();
            done[card.dataset.k] = d;
            if (Object.keys(done).length === 2) {
              await wait(400);
              const res = root.querySelector('.rain-result');
              res.innerHTML = `<b class="bad">🤔 같은 비인데 4치와 1치?!</b><br>모래흙은 빗물이 쑥쑥 스며들고, 진흙은 조금밖에 안 스며들어요.<br>이렇게 재면 <b>재는 곳마다 결과가 달라서</b> 비가 얼마나 왔는지 정확히 알 수 없어요.`;
              TT.sfx.bad();
              res.appendChild(nextBtn('그럼 어떻게 재지? ▶', phase2));
            }
          };
        });
      }

      // 2단계: 빗물을 받을 그릇 고르기
      function phase2() {
        root.innerHTML = `${head(1, '2. 그릇 고르기')}
          <div class="rain-msg">💡 땅 대신 <b>그릇에 빗물을 받아</b> 고인 물의 깊이를 재면 어떨까요?<br>비를 재기에 가장 알맞은 그릇을 골라 보세요!</div>
          <div class="vessel-row">${Object.entries(VESSELS).map(([k, v]) => `<button class="vessel" data-k="${k}">${v.svg}<b>${v.name}</b></button>`).join('')}</div>
          <div class="rain-result"></div>`;
        const res = root.querySelector('.rain-result');
        root.querySelectorAll('.vessel').forEach(b => (b.onclick = () => {
          const k = b.dataset.k;
          if (k !== 'cyl') {
            TT.sfx.bad(); b.classList.add('wrong'); b.disabled = true;
            res.innerHTML = `<span class="bad">💦 ${VESSELS[k].bad}</span>`;
            return;
          }
          TT.sfx.good();
          root.querySelectorAll('.vessel').forEach(x => (x.disabled = true));
          b.classList.add('right');
          res.innerHTML = `<b class="good">⭕ 바로 그거예요!</b><br>원통은 위아래 넓이가 같아서 <b>물 높이만 재면</b> 비의 양을 알 수 있어요.<br>쇠로 만들어 빗물이 스며들거나 새지도 않지요. 이것이 바로 <b>측우기</b>예요!`;
          res.appendChild(nextBtn('비 받아 보기 ▶', () => phase3(0)));
        }));
      }

      // 3단계: 비를 받아 자(주척)로 깊이 읽기
      const ROUNDS = [{ day: '5월 3일', v: 2 }, { day: '6월 17일', v: 5 }];
      const records = [];
      function phase3(ri) {
        const R = ROUNDS[ri];
        root.innerHTML = `${head(2, `3. 비 재기 (${ri + 1}/${ROUNDS.length})`)}
          <div class="rain-msg">📅 <b>${R.day}</b> — 측우기를 돌 받침 위에 놓고 비를 받아 볼까요?</div>
          <div class="gauge-area">
            <div class="gauge-wrap">
              <div class="sky"></div>
              <div class="ruler">${[0, 1, 2, 3, 4, 5, 6].map(i => `<span style="bottom:${i / 6 * 100}%">${i ? i + '치' : '0'}</span>`).join('')}</div>
              <div class="gauge"><div class="water"></div></div>
              <div class="pedestal"></div>
            </div>
            <div class="rain-log"><b>📒 비 기록장</b>${records.map(r => `<div>${r.day} : <b>${r.v}치</b></div>`).join('') || '<div class="empty">아직 기록이 없어요</div>'}</div>
          </div>
          <div class="rain-result"><div class="row"><button class="primary big" id="rain-go">🌧️ 비 내리기</button></div></div>`;
        const res = root.querySelector('.rain-result');
        root.querySelector('#rain-go').onclick = async () => {
          TT.sfx.water();
          const sky = root.querySelector('.sky');
          for (let i = 0; i < 26; i++) { const d = document.createElement('i'); d.style.left = (Math.random() * 100) + '%'; d.style.animationDelay = (Math.random() * 1.6) + 's'; sky.appendChild(d); }
          res.innerHTML = '<div class="rain-msg">쏴아아... 빗물이 측우기에 고이고 있어요.</div>';
          root.querySelector('.water').style.height = (R.v / 6 * 100) + '%';
          await wait(2600);
          sky.innerHTML = '';
          TT.sfx.water();
          res.innerHTML = `<div class="rain-msg">비가 그쳤어요! 자의 눈금과 물 높이를 나란히 보고, <b>물이 몇 치</b> 고였는지 읽어 보세요.</div>
            <div class="row">${[1, 2, 3, 4, 5].map(n => `<button class="big read-btn" data-key="${n}" data-n="${n}">${n}치</button>`).join('')}</div><div class="rain-hint"></div>`;
          res.querySelectorAll('.read-btn').forEach(b => (b.onclick = () => {
            const n = +b.dataset.n;
            if (n !== R.v) {
              TT.sfx.bad(); b.disabled = true; b.classList.add('wrong');
              res.querySelector('.rain-hint').innerHTML = `<span class="bad">🤔 다시 볼까요? 물의 윗면과 같은 높이에 있는 자의 숫자를 찾아보세요.</span>`;
              return;
            }
            TT.sfx.good();
            res.querySelectorAll('.read-btn').forEach(x => (x.disabled = true));
            b.classList.add('right');
            records.push(R);
            root.querySelector('.rain-log').innerHTML = `<b>📒 비 기록장</b>${records.map(r => `<div class="${r === R ? 'new' : ''}">${r.day} : <b>${r.v}치</b></div>`).join('')}`;
            res.querySelector('.rain-hint').innerHTML = `<b class="good">⭕ ${R.v}치! 기록장에 적었어요.</b>`;
            res.appendChild(nextBtn(ri < ROUNDS.length - 1 ? '다음 비 기다리기 ▶' : '기록 완료!', () => (ri < ROUNDS.length - 1 ? phase3(ri + 1) : finish())));
          }));
        };
      }

      function finish() {
        TT.sfx.reward();
        root.innerHTML = `<div class="mg-end">
          <div class="big-emo">🌧️📏</div>
          <h2>비를 정확히 재는 방법을 찾았어요!</h2>
          <p>땅에 스며든 깊이는 흙마다 달랐지만,<br><b>원통 그릇(측우기)</b>에 빗물을 받으면 어디서나 똑같이 잴 수 있어요.</p>
          <div class="rain-log big">${records.map(r => `<div>${r.day} : <b>${r.v}치</b></div>`).join('')}</div>
          <p>6월 17일에 비가 많이 왔네요! 이런 기록이 쌓이면<br>언제 씨를 뿌리고, 언제 물을 대야 할지 알 수 있어요.</p>
          <div class="row"><button class="primary big">장영실에게 보여 주기</button></div></div>`;
        root.querySelector('.primary').onclick = () => { TT.sfx.select(); ui.closeModal(); resolve(); };
      }
      phase1();
    });
  };
})();
