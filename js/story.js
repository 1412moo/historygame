// 이야기: NPC, 대사, 미션 진행, 도감 데이터
(function () {
  const TT = window.TT;
  const ui = TT.ui;
  const S = () => TT.state;

  // ------------------------------------------------------------ 외형
  const L = (TT.LOOKS = {
    player: { skin: '#ffd9b8', hair: '#3b2416', top: '#ffad3b', bottom: '#3e6fd6', shoes: '#e8463c', hat: 'kidhair', collar: false, extra: 'device' },
    sejong: { skin: '#f5cfa8', hair: '#1e1a17', top: '#c8302c', robe: true, hat: 'crown', beard: true, emblem: '#e8c14a', belt: '#2a2522', collar: '#f7f1e2', shoes: '#222' },
    jang: { skin: '#e9bb8e', hair: '#2a211b', top: '#7d9a6b', bottom: '#e9e2cf', hat: 'towel', beard: true, extra: 'apron' },
    merchant: { skin: '#f0c69c', hair: '#2b211a', top: '#4f6fa8', bottom: '#ece5d2', hat: 'gat', beard: true },
    farmer: { skin: '#dca777', hair: '#2b211a', top: '#efe7d4', bottom: '#d9cdb2', hat: 'towel', shoes: '#c9a46e' },
    mother: { skin: '#f6d2b0', hair: '#231b17', top: '#f1d36b', bottom: '#c94f6d', skirt: true, hat: 'bun', ribbon: '#c94f6d' },
    tteok: { skin: '#f3cba5', hair: '#2a1f19', top: '#f4efe2', bottom: '#6e8fcf', skirt: true, hat: 'bun', ribbon: '#6e8fcf' },
    potter: { skin: '#d9a271', hair: '#2b211a', top: '#a9845a', bottom: '#e3d8bf', hat: 'sangtu' },
    veg: { skin: '#f0c39a', hair: '#2b211a', top: '#9fcf86', bottom: '#5d8a4a', skirt: true, hat: 'bun', ribbon: '#5d8a4a' },
    girl: { skin: '#ffd9b8', hair: '#2b211a', top: '#f08a8a', bottom: '#f3ecd9', hat: 'braid', ribbon: '#e74c3c' },
    boy: { skin: '#ffd4ad', hair: '#2b211a', top: '#8fc6e8', bottom: '#f3ecd9', hat: 'braid' },
    guard: { skin: '#e8b88a', hair: '#2b211a', top: '#2f4f8f', robe: true, hat: 'guard', belt: '#c0392b', shoes: '#222' },
    official1: { skin: '#f0c69c', hair: '#2b211a', top: '#9a2f2f', robe: true, hat: 'samo', beard: true, belt: '#d9b44a', emblem: '#2f6f5f' },
    official2: { skin: '#f0c69c', hair: '#2b211a', top: '#2f4f8f', robe: true, hat: 'samo', beard: true, belt: '#d9b44a', emblem: '#d9b44a' },
    scholar: { skin: '#f3cba5', hair: '#2b211a', top: '#3f7f6a', robe: true, hat: 'samo', beard: true, belt: '#2a2522', emblem: '#d9b44a' },
    scholar2: { skin: '#f3cba5', hair: '#2b211a', top: '#5a7fb0', robe: true, hat: 'samo', belt: '#2a2522' },
    teacher: { skin: '#f0c69c', hair: '#8a8a8a', top: '#f1ebdc', robe: true, hat: 'gat', beard: true, beardColor: '#cfcac2', collar: '#2a2522' },
    grandma: { skin: '#f0c69c', hair: '#cfcac2', top: '#ede6d6', bottom: '#8a8f98', skirt: true, hat: 'bun' },
    apprentice: { skin: '#f0c39a', hair: '#2b211a', top: '#c9a46e', bottom: '#ece5d2', hat: 'towel' },
    dog: { kind: 'dog' },
  });

  TT.PLAYER = { name: () => S().name, look: L.player };
  const DEV = { name: '똑딱이 (시간 장치)', look: 'device' };
  const ME = TT.PLAYER;

  async function say(spk, ...lines) { for (const l of lines) await ui.say(spk, l); }
  const ask = (opts, o) => ui.choice(opts, o);

  // ------------------------------------------------------------ 도감
  TT.DEX = [
    { id: 'market', emoji: '🏪', name: '한양 시장과 백성', year: '조선 전기', desc: '백성들이 물건을 사고팔던 한양의 시장. 그 시절 많은 백성은 글을 몰라 장부를 읽거나, 나라의 알림(방)을 읽거나, 편지를 쓰기 어려웠어요.' },
    { id: 'sejong', emoji: '👑', name: '세종대왕', year: '조선 제4대 임금 · 재위 1418~1450', desc: '백성을 아끼는 마음으로 훈민정음을 만든 임금. 과학, 농업, 음악 등 여러 분야를 크게 발전시켰어요.' },
    { id: 'jiphyeon', emoji: '📚', name: '집현전', year: '1420년 확대 개편', desc: '세종대왕이 키운 학문 연구 기관. 뛰어난 학자들이 모여 책을 읽고 연구했고, 훈민정음을 풀이한 책(해례본)을 펴내는 데 힘을 보탰어요.' },
    { id: 'hunmin', emoji: '🔤', name: '훈민정음', year: '1443년 창제 · 1446년 반포', desc: '"백성을 가르치는 바른 소리"라는 뜻의 우리 글자. 자음은 소리 낼 때 입과 혀의 모양을, 모음은 하늘(·)·땅(ㅡ)·사람(ㅣ)을 본떠 만들었어요. 오늘날의 한글이에요!' },
    { id: 'jang', emoji: '🔧', name: '장영실', year: '조선 전기의 과학자', desc: '신분은 낮았지만 세종대왕이 재능을 알아보고 일을 맡긴 과학자. 자격루, 앙부일구 같은 여러 발명품을 만드는 데 참여했어요.' },
    { id: 'jagyeokru', emoji: '⏰', name: '자격루', year: '1434년', desc: '장영실 등이 만든 자동 물시계. 물이 차오르면 잣대가 떠오르고, 구슬이 굴러 인형이 종·북·징을 쳐서 시간을 알렸어요. 밤에도, 흐린 날에도 시간을 알 수 있었어요.' },
    { id: 'angbu', emoji: '☀️', name: '앙부일구', year: '1434년', bonus: true, desc: '솥처럼 오목한 해시계. 가운데 바늘(영침)이 북쪽 하늘의 북극을 향하도록 놓고, 그림자가 닿는 곳으로 시각을 읽어요. 종묘 앞 같은 길가에 두어 누구나 볼 수 있게 했고, 글을 모르는 백성을 위해 시각을 동물 그림으로 나타냈다고 해요.' },
    { id: 'honcheon', emoji: '🔭', name: '혼천의', year: '1433년 무렵', bonus: true, desc: '해·달·별의 위치와 움직임을 관측하던 천문 기구. 땅을 나타내는 지평환, 남북을 잇는 자오환, 해와 달의 길을 나타내는 고리들 안에서 망통으로 별을 겨누어 보았어요. 세종 때 경복궁에 간의대를 쌓고 하늘을 관측해 우리 하늘에 맞는 역법 『칠정산』을 만들었어요.' },
    { id: 'batchim', emoji: '🔡', name: '받침의 비밀', year: '훈민정음 해례본', bonus: true, desc: '"종성부용초성(終聲復用初聲)" — 끝소리(받침)는 첫소리 자음을 다시 쓴다는 원리. 받침을 위한 새 글자를 따로 만들지 않고도 곰, 달, 한글처럼 받침 있는 글자를 쓸 수 있어요. 첫소리·가운뎃소리·끝소리를 한 덩어리로 모아 쓰는 것도 훈민정음의 특징이에요.' },
    { id: 'cheugugi', emoji: '🌧️', name: '측우기', year: '1441년', desc: '빗물을 받는 원통 모양 쇠그릇. 고인 빗물의 깊이를 자(주척)로 재어 비의 양을 기록했어요. 『세종실록』에는 세자(훗날 문종)의 생각에서 시작되었다고 적혀 있고, 전국 고을에 두어 농사에 도움을 주었어요.' },
  ];

  // ------------------------------------------------------------ 보상
  TT.give = async function (r) {
    const s = S();
    s.shards += r.shards || 0;
    (r.dex || []).forEach(id => (s.dex[id] = 1));
    TT.save();
    ui.closeDialog();
    ui.updateHUD();
    ui.bumpShards();
    await ui.reward(r);
  };

  // ------------------------------------------------------------ 목표
  const STORY_NPCS = ['merchant', 'farmer', 'mother'];
  TT.story = {};
  TT.story.objective = function () {
    const s = S();
    const n = Object.keys(s.stories).length;
    switch (s.step) {
      case 0: case 1: return { text: `🏪 시장에서 사람들의 이야기를 들어 보자 (${Math.min(n, 2)}/2)`, map: 'hanyang', npcs: STORY_NPCS.filter(id => !s.stories[id]) };
      case 2: return { text: '🏯 궁궐로 가서 임금님을 만나자', map: 'palace_in', npc: 'sejong', door: 'palace' };
      case 3: return { text: '📚 집현전에서 새 글자의 비밀을 풀자', map: 'jiphyeon_in', npc: 'scholar_head', door: 'jiphyeon' };
      case 4: return { text: '🏯 세종대왕께 돌아가 알아낸 것을 전하자', map: 'palace_in', npc: 'sejong', door: 'palace' };
      case 5: return { text: '🔧 장영실의 작업장을 찾아가자 (시장 동쪽)', map: 'workshop_in', npc: 'jang', door: 'workshop' };
      case 6: return { text: '🌾 시장의 농부에게 비 이야기를 들어 보자', map: 'hanyang', npc: 'farmer' };
      case 7: return { text: '🌧️ 장영실과 함께 비를 재는 도구를 만들자', map: 'workshop_in', npc: 'jang', door: 'workshop' };
      default: return { text: '🎉 모든 미션 완료! 한양을 자유롭게 둘러보자' };
    }
  };

  async function afterStory() {
    const s = S();
    const n = Object.keys(s.stories).length;
    if (s.step < 2 && n >= 2) {
      await say(DEV, '삐빅! 백성들이 글을 몰라서 정말 힘들어하고 있구나...', '이 이야기를 임금님께 전해 보면 어떨까? 궁궐은 큰길을 따라 북쪽 끝에 있어!');
      s.step = 2;
      await TT.give({ title: '백성들의 이야기를 들었어요!', shards: 5, dex: ['market'], text: '그 시절 많은 백성은 글을 몰라 불편하고 억울한 일을 겪었어요.' });
    } else if (s.step < 2) {
      ui.updateHUD();
      await say(DEV, `다른 사람들 이야기도 들어 보자! 머리 위에 ! 표시가 있는 사람을 찾아봐. (${n}/2)`);
    }
  }

  // ------------------------------------------------------------ NPC
  const imp = fn => fn;
  TT.NPCS = [
    // ===== 한양 입구
    {
      id: 'gatekeeper', map: 'hanyang', x: 23, y: 41, dir: 1, name: '수문장', look: L.guard,
      important: () => !S().talked.gatekeeper,
      talk: async me => {
        if (S().step <= 1) {
          await say(me, '어서 오시오! 여기는 한양의 남쪽 큰 문, 숭례문이오.', '처음 보는 옷차림이구려... 먼 데서 왔나 보오?');
          await ask(['네! 아주 먼 곳에서 왔어요.', '여기가 한양이에요?']);
          await say(me, '허허, 그렇구려. 한양에는 임금님이 계신 궁궐도 있고, 사람 많은 시장도 있소.', '이 큰길을 따라 북쪽으로 가면 바로 시장이오. 사람들 사는 이야기를 듣기엔 시장만 한 곳이 없지!');
        } else if (S().step < 8) {
          await say(me, '궁궐은 시장 너머, 큰길 끝에 있다오. 장영실 나리의 작업장은 시장 동쪽이고.');
        } else {
          await say(me, '요즘 한양에 새 글자 이야기로 떠들썩하오! 백성들이 아주 좋아한다오.');
        }
      },
    },
    // ===== 시장: 이야기 NPC
    {
      id: 'merchant', map: 'hanyang', x: 18, y: 27, dir: 0, name: '비단 상인', look: L.merchant,
      important: () => S().step <= 1 && !S().stories.merchant,
      talk: async me => {
        const s = S();
        if (s.step >= 5) { await say(me, '새 글자가 생긴다는 소문 들었니? 스물여덟 자만 익히면 된다던데!', '그럼 나도 내 장부를 직접 읽을 수 있겠구나. 허허, 가슴이 다 두근거리는구나!'); return; }
        if (s.stories.merchant) { await say(me, '에휴, 이 장부에 뭐라고 적혀 있는지 언제쯤 읽을 수 있을꼬...'); return; }
        await say(me, '에휴... 이 장부를 읽고 싶은데, 글을 배우기가 너무 어렵구나.');
        const c = await ask(['왜 어려워요?', '장부가 뭐예요?']);
        if (c === 1) await say(me, '물건을 얼마나 팔고 샀는지 적어 두는 책이란다. 장사하는 사람에겐 아주 중요하지.', '그런데 나는 이걸 읽을 수가 없어.');
        await say(me, '지금 쓰는 글은 \'한자\'란다. 글자마다 뜻이 달라서 수천 자를 외워야 하지.', '농사짓고 장사하느라 바쁜 우리 같은 백성은 배울 틈이 없단다.', '누가 내 장부를 엉터리로 적어 놓아도, 나는 알 수가 없지 뭐냐...');
        await say(ME, '(글을 모르면 장사할 때도 손해를 볼 수 있구나...)');
        s.stories.merchant = 1;
        await afterStory();
      },
    },
    {
      id: 'farmer', map: 'hanyang', x: 23, y: 25, dir: 0, name: '농부', look: L.farmer,
      important: () => (S().step <= 1 && !S().stories.farmer) || S().step === 6,
      talk: async me => {
        const s = S();
        if (s.step === 6) {
          await say(me, '아이고, 올해는 비가 적게 와서 걱정이구나.', '관아에서는 비가 오면 땅을 파서 빗물이 얼마나 스며들었는지 잰단다.', '그런데 우리 밭은 모래흙이라 쑥쑥 스며들고, 옆 밭은 진흙이라 조금밖에 안 스며들어.');
          await ask(['같은 비인데 결과가 다르네요?', '그럼 비가 얼마나 왔는지 어떻게 알아요?']);
          await say(me, '그러게 말이다. 재는 곳마다 다르니, 나라에서도 비가 얼마나 왔는지 정확히 모른단다.', '비를 정확히 알아야 언제 씨를 뿌리고 물을 댈지 정할 텐데...', '손재주 좋은 장영실 나리라면 좋은 방법을 알지 않을까?');
          s.step = 7;
          ui.updateHUD();
          await say(DEV, '흙마다 다르게 스며든다니... 장영실 작업장으로 돌아가 보자!');
          return;
        }
        if (s.step >= 8) { await say(me, '측우기 덕분에 비가 얼마나 왔는지 정확히 안다더구나!', '이제 언제 물을 대야 할지 걱정이 덜하단다. 허허!'); return; }
        if (s.step >= 5) { await say(me, '이제 쉬운 글자가 생기면 방에 뭐라고 쓰였는지 내 눈으로 읽을 수 있겠지?', '그날이 오면 세금 내는 날을 놓칠 일도 없을 게다!'); return; }
        if (s.stories.farmer) { await say(me, '저 방에 무슨 말이 쓰여 있는지... 누가 좀 읽어 주면 좋겠구먼.'); return; }
        await say(me, '끙... 얘야, 저 옆에 붙은 \'방(榜)\'에 뭐라고 적혀 있는지 아니?');
        const c = await ask(['방이 뭐예요?', '저도 못 읽겠어요...']);
        if (c === 0) await say(me, '나라에서 백성들에게 알릴 것이 있으면 저렇게 글로 써서 붙인단다.');
        else await say(me, '허허, 너도 그렇구나. 꼬불꼬불 어려운 한자투성이지?');
        await say(me, '그런데 나는 글을 몰라서 읽을 수가 없어.', '작년에는 세금 내는 날이 적힌 방을 못 읽어서 큰 벌을 받을 뻔했지 뭐냐.', '나라에서 중요한 걸 알려 줘도, 글을 모르면 소용이 없단다...');
        s.stories.farmer = 1;
        await afterStory();
      },
    },
    {
      id: 'mother', map: 'hanyang', x: 18, y: 31, dir: 0, name: '어머니', look: L.mother,
      important: () => S().step <= 1 && !S().stories.mother,
      talk: async me => {
        const s = S();
        if (s.step >= 5) { await say(me, '새 글자라면... 나도 우리 아들에게 편지를 쓸 수 있겠구나!', '"밥은 잘 먹고 다니느냐" 그 한마디를 꼭 써 보내고 싶단다.'); return; }
        if (s.stories.mother) { await say(me, '우리 아들은 잘 지내고 있을까...'); return; }
        await say(me, '우리 아들이 먼 고을로 일하러 떠났단다.', '보고 싶다고, 밥은 잘 먹느냐고 편지를 쓰고 싶은데...');
        await ask(['편지를 쓰시면 되잖아요!', '왜 못 쓰세요?']);
        await say(me, '나는 글을 배운 적이 없어서 쓸 수가 없구나.', '하고 싶은 말은 이렇게 가슴에 가득한데, 글로 옮길 수가 없으니 답답하단다...');
        s.stories.mother = 1;
        await afterStory();
      },
    },
    // ===== 시장: 분위기 NPC
    {
      id: 'tteok', map: 'hanyang', x: 16, y: 32, dir: 0, name: '떡장수', look: L.tteok,
      talk: async me => {
        await say(me, '떡 사려~ 떡! 쫄깃쫄깃 맛있는 떡이오!', '쌀이나 베(옷감)를 가져오면 떡이랑 바꿔 주지. 이 시절 시장에선 물건끼리 바꾸는 일이 많단다.');
        if (S().step < 5) await say(me, '참, 요즘 장영실이라는 솜씨 좋은 사람이 임금님을 위해 신기한 물건을 만든다더구나!');
      },
    },
    {
      id: 'potter', map: 'hanyang', x: 27, y: 28, dir: 0, name: '옹기장수', look: L.potter,
      talk: async me => { await say(me, '옹기 사시오~! 옹기는 숨을 쉬는 그릇이라 된장, 간장 담기에 딱이라오.', '흙으로 빚어 불에 구운, 우리 조상들의 지혜가 담긴 그릇이지!'); },
    },
    {
      id: 'veg', map: 'hanyang', x: 27, y: 32, dir: 0, name: '채소 장수', look: L.veg,
      important: () => S().step >= 1 && !S().flags.sundial,
      talk: async me => {
        if (S().flags.sundial) { await say(me, '해시계를 고쳐 줬다며? 고맙구나! 덕분에 장 닫을 시간을 놓치지 않겠어.', '배추 한 포기 가져가렴~ 허허!'); return; }
        await say(me, '배추랑 무가 아주 싱싱해요~!', '그런데 큰일이야. 아까 수레가 저 앙부일구(해시계)를 들이받았지 뭐냐.', '그 뒤로 해시계가 엉터리 시각을 가리켜서 장사꾼들이 다들 헷갈려해.');
        await say(DEV, '해시계 방향을 맞춰 주면 되겠다! 바로 옆 해시계를 조사해 보자. (⭐ 보너스 미션)');
      },
    },
    {
      id: 'girl', map: 'hanyang', x: 20, y: 29, dir: 0, name: '시장 아이', look: L.girl, wander: 2,
      talk: async me => {
        if (S().step >= 5) { await say(me, '새 글자는 아주 쉽대! 나도 배워서 내 이름을 써 볼 거야!'); return; }
        await say(me, '나도 글을 읽고 싶어!', '그런데 서당은 양반집 아이들만 다닐 수 있고, 한자는 너무 어려워...');
      },
    },
    // ===== 마을
    {
      id: 'teacher', map: 'hanyang', x: 6, y: 14, dir: 0, name: '훈장님', look: L.teacher,
      talk: async me => {
        if (S().step >= 5) { await say(me, '새 글자는 스물여덟 자뿐이라고? 허허, 세상이 바뀌겠구나!'); return; }
        await say(me, '하늘 천(天), 따 지(地), 검을 현(玄), 누를 황(黃)~', '천자문에는 서로 다른 한자가 천 개나 들어 있단다.', '한자를 익히려면 몇 해 동안 열심히 공부해야 하지. 바쁜 백성들은 엄두를 못 내는 일이야.');
      },
    },
    {
      id: 'boy', map: 'hanyang', x: 4, y: 14, dir: 0, name: '서당 아이', look: L.boy,
      talk: async me => { await say(me, '천 글자를 언제 다 외워... 벌써 머리가 빙글빙글 돌아!', '쉬운 글자가 있으면 좋겠다~'); },
    },
    {
      id: 'grandma', map: 'hanyang', x: 6, y: 20, dir: 1, name: '할머니', look: L.grandma,
      talk: async me => { await say(me, '장독대에는 된장, 간장을 담근 항아리가 있단다.', '햇볕을 잘 받아야 맛있게 익지. 허허, 너도 한 숟갈 맛볼 테냐?'); },
    },
    {
      id: 'dog', map: 'hanyang', x: 11, y: 19, dir: 0, name: '백구', look: L.dog, wander: 3,
      talk: async me => { await say(me, '멍멍! 🐶', '(꼬리를 살랑살랑 흔든다. 우리나라 토종개처럼 생겼다!)'); },
    },
    // ===== 궁궐 앞
    {
      id: 'guard1', map: 'hanyang', x: 20, y: 11, dir: 0, name: '궁궐 문지기', look: L.guard,
      important: () => false,
      talk: async me => { await palaceGuard(me); },
    },
    {
      id: 'guard2', map: 'hanyang', x: 23, y: 11, dir: 0, name: '궁궐 문지기', look: L.guard,
      talk: async me => { await palaceGuard(me); },
    },
    // ===== 집현전 앞
    {
      id: 'scholar_door', map: 'hanyang', x: 34, y: 15, dir: 0, name: '집현전 학자', look: L.scholar2,
      talk: async me => { await jiphyeonKeeper(me); },
    },
    // ===== 작업장 앞
    {
      id: 'apprentice', map: 'hanyang', x: 30, y: 37, dir: 1, name: '작업장 제자', look: L.apprentice,
      place: () => (S().step >= 5 ? [31, 36, 1] : [30, 37, 1]),
      talk: async me => {
        if (S().step < 5) {
          await say(me, '여기는 장영실 나리의 작업장이에요!', '나리께서 지금 아주 중요한 발명을 하고 계셔서 아무나 들어갈 수 없어요.');
          if (S().step < 2) await say(DEV, '장영실...? 어디서 들어 본 이름인데! 나중에 다시 와 보자.');
          else await say(DEV, '임금님과 관계있는 사람인가 봐. 먼저 지금 목표부터 해결하자!');
        } else {
          await say(me, '전하께서 보내셨다고요? 나리께서 안에서 기다리고 계세요!');
        }
      },
    },
    // ===== 궁궐 안
    {
      id: 'sejong', map: 'palace_in', x: 7, y: 3, dir: 0, name: '세종대왕', look: L.sejong,
      important: () => S().step === 2 || S().step === 4,
      talk: async me => { await sejongTalk(me); },
    },
    {
      id: 'official1', map: 'palace_in', x: 4, y: 5, dir: 2, name: '신하', look: L.official1,
      talk: async me => { await say(me, '전하께서는 밤늦게까지 책을 읽으시느라 눈병이 나실 정도였다오.', '백성을 위한 일이라면 쉬지 않으시는 분이지.'); },
    },
    {
      id: 'official2', map: 'palace_in', x: 10, y: 5, dir: 1, name: '신하', look: L.official2,
      talk: async me => { await say(me, '전하께서는 농사짓는 백성을 위해 \'농사직설\'이라는 농사책도 펴내셨소.', '우리 땅에 맞는 농사법을 농부들에게 직접 물어 모았다오.'); },
    },
    // ===== 집현전 안
    {
      id: 'scholar_head', map: 'jiphyeon_in', x: 7, y: 3, dir: 0, name: '집현전 학자', look: L.scholar,
      important: () => S().step === 3,
      talk: async me => { await scholarTalk(me); },
    },
    {
      id: 'scholar_a', map: 'jiphyeon_in', x: 2, y: 6, dir: 2, name: '젊은 학자', look: L.scholar2,
      important: () => S().step >= 4 && !S().flags.batchim,
      talk: async me => { await batchimTalk(me); },
    },
    {
      id: 'scholar_b', map: 'jiphyeon_in', x: 12, y: 6, dir: 1, name: '나이 든 학자', look: L.official2,
      talk: async me => { await say(me, '"가, 갸, 거, 겨..." 말소리를 하나하나 나누어 보고 있소.', '우리말 소리는 참으로 재미있구려!'); },
    },
    // ===== 작업장 안
    {
      id: 'jang', map: 'workshop_in', x: 6, y: 3, dir: 0, name: '장영실', look: L.jang,
      important: () => S().step === 5 || S().step === 7,
      talk: async me => { await jangTalk(me); },
    },
    {
      id: 'astro', map: 'workshop_in', x: 9, y: 5, dir: 2, name: '서운관 관원', look: L.scholar2,
      important: () => S().step >= 6 && !S().flags.astro,
      talk: async me => { await astroTalk(me); },
    },
    {
      id: 'helper', map: 'workshop_in', x: 3, y: 6, dir: 2, name: '작업장 일꾼', look: L.potter,
      talk: async me => { await say(me, '뚝딱뚝딱! 나리께서는 해시계, 물시계, 하늘을 관측하는 기구까지 못 만드시는 게 없어요.', '원래 신분이 낮으셨는데, 전하께서 그 재주를 알아보셨대요!'); },
    },
  ];

  // ------------------------------------------------------------ 장소 스크립트
  async function palaceGuard(me) {
    if (S().step < 2) {
      await say(me, '멈추시오! 이곳은 임금님께서 계신 궁궐이오.', '전하께서는 요즘 글을 몰라 고생하는 백성들 걱정이 크시다오.', '시장에 가서 백성들의 이야기를 듣고 오면, 내 전하께 아뢰어 주리다.');
    } else {
      await say(me, '백성들의 이야기를 듣고 왔다고? 전하께서 기다리고 계시오. 어서 드시오!');
    }
  }
  async function jiphyeonKeeper(me) {
    if (S().step < 3) {
      await say(me, '이곳은 나라의 학자들이 모여 연구하는 집현전이오.', '지금은 아주 중요한 연구 중이라 아무나 들어올 수 없소.');
    } else {
      await say(me, '전하께서 보내셨다고? 어서 들어가 보시오! 안에서 학자들이 기다리고 있소.');
    }
  }

  TT.story.door = async function (door) {
    const s = S();
    const npcSpk = id => TT.findNPC(id);
    switch (door) {
      case 'palace':
        if (s.step < 2) { await palaceGuard(npcSpk('guard1')); return; }
        await TT.enterMap('palace_in');
        return;
      case 'jiphyeon':
        if (s.step < 3) { await jiphyeonKeeper(npcSpk('scholar_door')); return; }
        await TT.enterMap('jiphyeon_in');
        return;
      case 'workshop':
        await TT.enterMap('workshop_in');
        return;
      case 'citygate':
        await say(npcSpk('gatekeeper'), '지금은 성 밖으로 나갈 일이 없을 거요. 한양 안을 둘러보시오!');
        return;
      case 'seodang':
        await say(null, '서당 안에서 "하늘 천, 따 지~" 하고 천자문 외우는 소리가 들린다.', '(지금은 수업 중이라 들어갈 수 없어요.)');
        return;
      default:
        await say(null, '똑똑... 아무도 없는 것 같다.');
    }
  };

  // 조사할 수 있는 사물
  TT.story.objects = {
    notice: async () => {
      await ui.card(`<h2>📜 방(榜)</h2><div class="hanja-board">告 示<br>今年 稅穀<br>十月 望前 納官<br>違者 論罪</div><p>꼬불꼬불 어려운 글자가 가득하다... 하나도 읽을 수가 없다!</p>`, '음...');
      await say(DEV, '이건 \'한자\'라는 글자야. 이 시대엔 나라의 알림도 모두 한자로 썼대.');
      if (!S().stories.farmer && S().step <= 1) await say(DEV, '옆에 있는 농부 아저씨한테 물어볼까?');
    },
    sundial: async () => {
      const s = S();
      if (s.flags.sundial) {
        await say(null, '방향을 바로잡은 앙부일구다. 바늘이 북쪽 북악산을 향하고 있다.', '그림자가 🐴 말 그림 위에 있다. 지금은 오시(午時), 한낮이다!');
        return;
      }
      await say(null, '솥처럼 오목한 해시계, \'앙부일구\'다!', '그런데... 받침이 비뚤어져 있다. 해는 하늘 높이 떠 있는데 그림자는 엉뚱한 곳을 가리킨다!');
      await say(DEV, '수레에 부딪혀서 방향이 돌아가 버렸나 봐!', '앙부일구 가운데의 바늘을 \'영침\'이라고 해. 영침은 언제나 북쪽 하늘(북극)을 향하게 놓아야 그림자가 시각을 바르게 가리킨대.', '한양의 북쪽에는 궁궐 뒤 북악산이 있어. 방향을 맞춰 볼까?');
      const c = await ask(['좋아, 고쳐 보자!', '나중에 할게.']);
      if (c === 1) { await say(DEV, '알았어. 시장에 오면 언제든 다시 살펴보자!'); return; }
      ui.closeDialog();
      await TT.sundialGame();
      await say(DEV, '해냈어! 이제 시장 사람들이 다시 시간을 알 수 있겠다!', '그림자가 가리키는 곳에 글자 대신 동물 그림이 있었지? 글을 모르는 백성도 시각을 알 수 있게 한 거래.');
      ui.closeDialog();
      await TT.quiz(QUIZ_SUNDIAL, '📝 해시계 질문');
      s.flags.sundial = 1;
      const had = !!s.dex.angbu;
      await TT.give({ title: '⭐ 보너스 미션 완료!', shards: 10, dex: had ? [] : ['angbu'], text: '앙부일구의 방향을 바로잡았어요. 바늘(영침)은 북쪽을 향해요!' });
    },
    sign_start: () => say(null, '⬆ 한양 시장 · 궁궐'),
    sign_cross: () => say(null, '⬆ 궁궐   ➡ 집현전   ⬅ 마을   ⬇ 시장 · 숭례문'),
    sign_market: () => say(null, '🏪 한양 시장 — 없는 것 빼고 다 있소!'),
    sign_workshop: () => say(null, '➡ 장영실 작업장 (허락 없이 들어오지 마시오)'),
    sign_village: () => say(null, '⬅ 마을 · 서당'),
    jars: () => say(null, '장독대: 된장, 간장이 맛있게 익어 가고 있다.'),
    well: () => say(null, '맑은 물이 찰랑찰랑. 마을 사람들이 함께 쓰는 우물이다.'),
    drum: () => say(null, '\'신문고\'라는 북이다. 억울한 일이 있는 백성이 이 북을 치면 임금님께 사정을 알릴 수 있었대.', '하지만 글을 모르면 억울한 사정을 글로 적어 올리기도 어려웠겠지...'),
    crate: () => say(null, '나무 상자가 입구를 막고 있다.'),
    rain: () => S().step >= 8
      ? say(null, '완성된 측우기다! 돌 받침 위의 원통 그릇에 빗물을 받아 자로 깊이를 잰다.')
      : say(null, '빗물을 받아 비가 얼마나 왔는지 재는 도구 같다... 아직 만드는 중인가 봐.'),
    gears: () => say(null, '톱니바퀴와 부품이 가득하다!'),
    logs: () => say(null, '잘 말린 통나무. 발명품의 재료인가 보다.'),
    armillary: async () => {
      if (S().flags.astro) { await say(null, '조립을 마친 혼천의다. 고리들 사이로 망통이 하늘을 향해 있다.'); return; }
      await say(null, '크고 작은 쇠고리와 막대가 바닥에 흩어져 있다. 무언가를 조립하다 만 것 같다.');
      if (S().step >= 6) await say(DEV, '옆에 있는 서운관 관원에게 물어보자!');
    },
    clockmodel: () => say(null, '항아리들이 계단처럼 놓여 있다. 물시계 모형인가 봐!'),
    bench: () => say(null, '톱, 망치, 끌... 손때 묻은 연장들이 가지런하다.'),
    shelf: () => say(null, '책이 차곡차곡 쌓여 있다. 모두 한자로 쓰인 책이다.'),
    desk: () => say(null, '펼쳐진 책 위에 붓과 먹이 놓여 있다.'),
    throne: () => say(null, '임금님이 앉으시는 자리, 어좌다.'),
    pillar: () => say(null, '붉은 기둥이 웅장하다.'),
    chart: () => say(null, '벽에 "ㄱ ㄴ ㅁ ㅅ ㅇ", "· ㅡ ㅣ" 가 크게 쓰여 있다!'),
    screen: () => say(null, '해와 달, 다섯 봉우리가 그려진 병풍. \'일월오봉도\'다.'),
  };

  // ------------------------------------------------------------ 세종
  async function sejongTalk(me) {
    const s = S();
    if (s.step === 2) {
      await say(me, '먼 곳에서 온 아이로구나. 어서 오너라.', '시장에 다녀왔다고? 그래, 백성들은 어떻게 지내더냐?');
      const opts = [], keys = [];
      if (s.stories.merchant) { opts.push('상인 아저씨가 글을 몰라서 장부를 못 읽는대요.'); keys.push('merchant'); }
      if (s.stories.farmer) { opts.push('농부 아저씨가 나라의 방을 못 읽어서 혼날 뻔했대요.'); keys.push('farmer'); }
      if (s.stories.mother) { opts.push('어머니가 아들에게 편지를 쓰고 싶은데 글을 모르신대요.'); keys.push('mother'); }
      const c = await ask(opts);
      const react = { merchant: '장사하는 이가 제 장부도 읽지 못하니, 속아도 알 길이 없겠구나...', farmer: '나라의 법과 알림을 백성이 읽지 못한다면, 무슨 소용이 있겠느냐...', mother: '자식에게 마음 한 줄 전하지 못하는 어미의 심정이 어떻겠느냐...' };
      await say(me, react[keys[c]]);
      await say(me, '우리말은 중국말과 달라서, 한자로는 우리말을 그대로 적기가 어렵단다.', '그래서 백성들이 하고 싶은 말이 있어도, 끝내 제 뜻을 글로 펴지 못하는 이가 많구나.', '나는 이것이 늘 마음이 아팠다.');
      await say(me, '그래서 결심하였다. 백성들이 자신의 생각을 글로 표현할 수 있도록, 누구나 쉽게 배우는 새로운 글자를 만들고 싶구나.');
      const c2 = await ask(['제가 도울게요!', '새 글자요? 어떻게 만들어요?']);
      if (c2 === 1) await say(me, '사람이 말할 때 입과 혀가 움직이는 모양을 본뜨는 것이다. 그 비밀은 집현전 학자들이 잘 알고 있지.');
      await say(me, '좋다! 집현전으로 가 보거라. 학자들과 함께 말소리를 연구하고 있단다.', '새 글자의 비밀을 직접 풀어 보아라.');
      s.step = 3;
      await TT.give({ title: '세종대왕을 만났어요!', shards: 5, dex: ['sejong'], text: '세종대왕은 글을 몰라 고생하는 백성들을 위해 새 글자를 만들기로 했어요.' });
      await say(DEV, '집현전은 궁궐 앞 큰길에서 동쪽(오른쪽)에 있어!');
    } else if (s.step === 3) {
      await say(me, '집현전은 큰길 동쪽에 있다. 학자들이 너를 기다리고 있을 것이다.');
    } else if (s.step === 4) {
      await say(me, '오, 돌아왔구나! 집현전에서 무엇을 알아냈느냐?');
      await ask(['자음이랑 모음을 합치면 소리가 돼요!', '모음만 바꿔도 다른 소리가 나요!']);
      await say(me, '그렇다! 스물여덟 자만 익히면 누구나 자기 말을 글로 쓸 수 있지.', '나는 이 글자를 \'훈민정음\'이라 부르겠다.', '\'백성을 가르치는 바른 소리\'라는 뜻이니라.');
      await say(DEV, '훈민정음 해례본에는 "슬기로운 사람은 아침이 가기 전에, 어리석은 사람도 열흘이면 배울 수 있다"고 적혀 있대!');
      await say(me, '그럼 네가 얼마나 잘 이해했는지, 몇 가지 물어보겠다.');
      ui.closeDialog();
      const score = await TT.quiz(QUIZ_SEJONG, '📝 세종대왕의 질문');
      await say(me, score === QUIZ_SEJONG.length ? '모두 단번에 맞히다니, 참으로 훌륭하구나!' : '틀려도 괜찮다. 다시 생각해 보고 끝내 답을 찾았으니, 그것이 진짜 배움이니라.');
      s.step = 5;
      await TT.give({ title: '세종대왕의 질문을 모두 풀었어요!', shards: 10, text: '훈민정음은 \'백성을 가르치는 바른 소리\'라는 뜻이에요.' });
      await say(me, '그런데... 너에게서 째깍째깍 신기한 기계 소리가 나는구나.', '장영실을 찾아가 보거라. 그는 물시계를 만드는 솜씨 좋은 이다.', '신분은 낮았으나 재주가 뛰어나 내가 곁에 두었지. 장영실의 작업장은 시장 동쪽에 있다.');
      await say(DEV, '장영실이라면 내 고장도 고칠 수 있을지 몰라! 가 보자!');
    } else if (s.step === 5) {
      await say(me, '장영실은 만나 보았느냐? 시장 동쪽 작업장에 있다.');
    } else {
      await say(me, '고맙구나, 먼 데서 온 아이야.', '네 덕분에 백성들이 제 뜻을 글로 쓰게 될 날이 한 걸음 가까워졌구나.');
    }
  }

  const QUIZ_SEJONG = [
    { q: '세종대왕이 새로운 글자를 만든 가장 중요한 이유는 무엇일까요?', opts: ['백성들이 쉽게 글을 배울 수 있도록', '전쟁을 준비하기 위해', '궁궐을 크게 만들기 위해'], a: 0,
      why: '글을 몰라 장부도, 나라의 알림도, 편지도 읽고 쓰지 못하던 백성들을 위해서였어요.',
      hint: '시장에서 만난 사람들을 떠올려 봐요. 글을 몰라서 장부를 못 읽고, 나라의 알림(방)을 못 읽고, 편지도 못 쓰는 사람들이 있었죠. 세종대왕은 이런 백성들을 보며 마음 아파하셨어요.' },
    { q: '자음 \'ㄴ\'은 무엇의 모양을 본떠 만들었을까요?', opts: ['나무가 서 있는 모양', '혀끝이 윗잇몸에 닿는 모양', '물이 흐르는 모양'], a: 1,
      why: '"느~" 하고 소리 내 보면 혀끝이 윗잇몸에 닿아요. 그 모양이 바로 ㄴ!',
      hint: '집현전 학자님 말씀을 떠올려 봐요. 자음은 소리를 낼 때 입과 혀의 모양을 본떴어요. 직접 "느~" 하고 소리 내 보세요. 혀끝이 어디에 닿나요?' },
    { q: 'ㅁ 에 ㅜ 를 합치면 어떤 글자가 될까요?', opts: ['마', '미', '무'], a: 2,
      why: 'ㅁ + ㅜ = 무! 자음과 모음을 합치면 소리가 돼요.',
      hint: '글자 공방에서 ㅁ 하나로 마·무·미를 만들었던 걸 기억해요? ㅏ를 붙이면 \'마\', ㅣ를 붙이면 \'미\'였어요. 그럼 ㅜ를 붙이면?' },
    { q: '세종대왕이 만든 새 글자의 이름은 무엇일까요?', opts: ['천자문', '동의보감', '훈민정음'], a: 2,
      why: '훈민정음은 \'백성을 가르치는 바른 소리\'라는 뜻이에요. 오늘날 우리가 쓰는 한글이랍니다.',
      hint: '세종대왕께서 방금 알려 주셨어요. \'백성을 가르치는 바른 소리\'라는 뜻의 이름! 천자문은 서당 아이들이 외우던 한자 책이에요.' },
  ];

  // ------------------------------------------------------------ 집현전 학자
  async function scholarTalk(me) {
    const s = S();
    if (s.step < 3) { await say(me, '어허, 연구 중이니 조용히 해 주시오.'); return; }
    if (s.step > 3) { await say(me, '자음과 모음을 합치면 소리가 된다! 참 신기하지 않느냐?', '전하께서 기뻐하셨다니 나도 기쁘구나.'); return; }
    await say(me, '전하께서 보내신 아이로구나! 마침 잘 왔다.', '우리는 사람이 말할 때 입과 혀가 어떻게 움직이는지 연구하고 있단다.', '자, \'그\' 하고 소리 내 보거라. 혀뿌리가 목구멍을 막지 않느냐?');
    await ask(['그~ 정말이에요!', '느~ 는 혀끝이 위에 닿아요!']);
    await say(me, '그렇지! 그래서 새 글자의 자음은 소리 낼 때의 모양을 본떠 만들었단다.');
    await ui.card(`<h2>🗣️ 자음(닿소리)의 비밀</h2>
      <div class="letter-grid">
        <div><b>ㄱ</b><span>혀뿌리가 목구멍을 막는 모양</span></div>
        <div><b>ㄴ</b><span>혀끝이 윗잇몸에 닿는 모양</span></div>
        <div><b>ㅁ</b><span>입 모양</span></div>
        <div><b>ㅅ</b><span>이(치아) 모양</span></div>
        <div><b>ㅇ</b><span>목구멍 모양</span></div>
      </div><p>여기에 획을 더하면 ㅋ, ㄷ, ㅂ, ㅈ, ㅎ 같은 글자가 생겨요!</p>`, '신기해요!');
    await say(me, '모음은 이 세상을 이루는 하늘, 땅, 사람을 본떠 만들었지.');
    await ui.card(`<h2>☀️ 모음(홀소리)의 비밀</h2>
      <div class="letter-grid three">
        <div><b>·</b><span>둥근 하늘</span></div>
        <div><b>ㅡ</b><span>평평한 땅</span></div>
        <div><b>ㅣ</b><span>서 있는 사람</span></div>
      </div><p>이 셋을 합쳐 ㅏ, ㅓ, ㅗ, ㅜ 같은 모음을 만들어요.<br>예) ㅣ + · = ㅏ</p>`, '알겠어요!');
    await say(me, '이제 가장 중요한 비밀이다. 자음과 모음을 합치면 소리가 된단다.', '말로 듣는 것보다 직접 해 보는 게 낫겠지? 저기 글자 공방에서 글자를 만들어 보거라!');
    ui.closeDialog();
    await TT.hangulGame();
    await say(me, '훌륭하다! 자음과 모음을 합치는 원리를 깨쳤구나!', '이 원리만 알면 몇 개의 글자로 세상의 거의 모든 말소리를 적을 수 있지.');
    s.step = 4;
    await TT.give({ title: '훈민정음의 비밀을 하나 알아냈습니다!', shards: 10, dex: ['jiphyeon', 'hunmin'], text: '자음과 모음을 합치면 소리가 된다!' });
    await say(me, '어서 전하께 가서 알려 드리거라. 무척 기뻐하실 게다!');
  }

  // ------------------------------------------------------------ 장영실
  async function jangTalk(me) {
    const s = S();
    if (s.step < 5) { await say(me, '지금은 바빠서... 미안하구나.'); return; }
    if (s.step === 6) { await say(me, '시장의 농부에게 요즘 비 이야기를 먼저 들어 보거라. 농사짓는 사람의 걱정을 알아야 좋은 도구를 만들 수 있단다.'); return; }
    if (s.step === 7) { await rainTalk(me); return; }
    if (s.step > 7) { await say(me, '자격루는 시간을, 측우기는 비를 재지.', '하늘의 일을 정확히 재면 백성의 삶이 편해진단다. 다음에 또 오너라!'); return; }
    await say(me, '전하께서 보내신 아이로구나. 나는 장영실이라 한다.', '해시계는 해가 있을 때만 시간을 알려 주지.', '그럼 밤이나 흐린 날엔 어떻게 시간을 알 수 있을까?');
    const c = await ask(['음... 모르겠어요.', '물을 이용하면 어때요?']);
    await say(me, c === 1 ? '허허, 눈치가 빠르구나! 바로 그거다.' : '허허, 어려운 문제지. 답은 바로 \'물\'이란다.', '물이 일정하게 흐르면, 흐른 물의 양으로 시간이 얼마나 지났는지 알 수 있단다.', '그래서 저절로 시간을 알려 주는 물시계를 만들고 있지.');
    await say(me, '그런데 이런! 부품이 뒤섞여 버렸구나.', '물이 위에서 아래로 차례차례 흐르도록, 부품을 순서대로 맞춰 주겠니?');
    ui.closeDialog();
    await TT.waterClockGame();
    await say(me, '해냈구나! 이것이 스스로 시간을 알리는 물시계, \'자격루\'다!', '물이 차오르면 잣대가 떠오르고, 구슬이 굴러 인형이 종과 북과 징을 치지.', '사람이 밤새 지키지 않아도 시간을 알 수 있단다.');
    await say(me, '그럼 마지막으로 하나만 물어보마.');
    ui.closeDialog();
    await TT.quiz([{ q: '자격루 같은 물시계가 해시계보다 좋은 점은 무엇일까요?', opts: ['물을 마실 수 있다', '밤이나 흐린 날에도 시간을 알 수 있다', '아무 소리도 나지 않는다'], a: 1,
      why: '해시계는 해가 있어야 하지만, 물시계는 밤에도 흐린 날에도 시간을 알려 줘요. 게다가 자격루는 인형이 종을 쳐서 스스로 시간을 알렸어요!',
      hint: '장영실의 말을 떠올려 봐요. 해시계는 해가 있을 때만 쓸 수 있었죠. 물은 밤에도, 흐린 날에도 똑같이 흘러요!' }], '📝 장영실의 질문');
    await TT.give({ title: '자격루를 완성했어요!', shards: 10, dex: ['jang', 'jagyeokru'], text: '장영실은 낮은 신분이었지만, 세종대왕이 재능을 알아보아 훌륭한 과학자가 되었어요.' });
    await say(me, '그런데 네 손목의 그 장치... 째깍째깍 소리가 나는 걸 보니 시계로구나?', '내가 한번 보마... 옳지, 톱니 하나가 빠져 있었구나. 끼워 주마.');
    await say(DEV, '삐빅! 훨씬 나아졌어! 그런데... 시간 조각이 아직 조금 모자라.');
    await say(me, '그렇다면 하나만 더 도와주겠니?', '요즘 전하께서 비 걱정이 크시다. 비가 너무 적으면 가뭄, 너무 많으면 홍수가 나니 농사가 어렵지.', '시장에 있는 농부에게 요즘 비 이야기를 들어 보거라.');
    s.step = 6;
    ui.updateHUD();
    await say(DEV, '시장에 있는 농부 아저씨를 찾아가 보자!');
  }

  // ------------------------------------------------------------ 측우기
  async function rainTalk(me) {
    const s = S();
    await say(me, '농부의 이야기를 들었느냐? 땅을 파서 재니 흙마다 결과가 다르다고?');
    await ask(['네! 모래흙이랑 진흙이 달랐대요.', '그럼 비를 어떻게 재요?']);
    await say(me, '마침 세자 저하께서 좋은 생각을 내셨단다.', '땅이 아니라 그릇에 빗물을 받아서, 고인 물의 깊이를 자로 재면 어떻겠느냐고!', '자, 나와 함께 직접 실험해 보자꾸나.');
    ui.closeDialog();
    await TT.rainGaugeGame();
    await say(me, '훌륭하다! 이것이 비의 양을 재는 그릇, \'측우기\'다.', '전국 고을마다 측우기를 두고 비가 올 때마다 깊이를 재어 한양으로 보고하게 할 것이다.', '기록이 쌓이면 언제 씨를 뿌리고, 언제 물을 대야 할지 알 수 있지.');
    await say(me, '그럼 배운 것을 확인해 보마.');
    ui.closeDialog();
    await TT.quiz(QUIZ_RAIN, '📝 측우기 질문');
    await TT.give({ title: '측우기를 완성했어요!', shards: 10, dex: ['cheugugi'], text: '비의 양을 정확히 재고 기록해서 농사에 도움을 주었어요.' });
    await say(DEV, '삐비비빅! 시간 조각이 모두 모였어! 장치가 완전히 움직여!', '{name}, 고마워! 이제 원래 시간으로 돌아갈 수 있어!');
    s.step = 8;
    s.flags.ended = true;
    TT.save();
    ui.closeDialog();
    ui.updateHUD();
    await ui.ending();
  }
  // ------------------------------------------------------------ 혼천의 (보너스)
  async function astroTalk(me) {
    const s = S();
    if (s.step < 6) { await say(me, '나는 하늘을 살피는 서운관의 관원이오. 장영실 나리께 의논드릴 일이 있어 기다리는 중이오.'); return; }
    if (s.flags.astro) { await say(me, '혼천의 덕분에 별자리를 정확히 살필 수 있게 되었소!', '이렇게 모은 관측 기록으로 우리 하늘에 맞는 달력, 칠정산을 만들 것이오.'); return; }
    await say(me, '오, 자격루를 완성한 그 아이로구나! 마침 잘 왔다.', '나는 하늘의 해와 달, 별을 살피는 「서운관」의 관원이란다.');
    await say(me, '중국의 달력은 중국 하늘에 맞춘 것이라, 우리 하늘과 조금씩 어긋난단다.', '절기가 어긋나면 씨 뿌릴 때를 놓치니 농사에 큰일이지.', '그래서 전하께서 우리 하늘을 직접 관측하라 하셨는데... 관측 기구 「혼천의」의 부품이 이렇게 흩어져 버렸구나.');
    const c = await ask(['제가 조립해 볼게요!', '혼천의가 뭐예요?']);
    if (c === 1) await say(me, '하늘을 둥근 고리들로 나타낸 기구란다. 고리 안쪽의 관(망통)으로 별을 겨누면 별의 위치를 잴 수 있지.');
    await say(me, '여기 설계도가 있다. 설계도의 설명을 잘 읽고, 바깥에서 안쪽 순서로 부품을 맞춰 주겠니?');
    ui.closeDialog();
    await TT.armillaryGame();
    await say(me, '훌륭하구나! 북극성을 찾았으니, 이제 다른 별들의 자리도 북극성을 기준으로 잴 수 있단다.', '이렇게 하늘을 꼼꼼히 관측해서 우리 하늘에 맞는 달력을 만들 것이다.');
    ui.closeDialog();
    await TT.quiz(QUIZ_ASTRO, '📝 혼천의 질문');
    s.flags.astro = 1;
    await TT.give({ title: '⭐ 보너스 미션 완료!', shards: 10, dex: ['honcheon'], text: '혼천의를 조립하고 북극성을 찾았어요!' });
  }
  const QUIZ_ASTRO = [
    { q: '혼천의는 무엇을 하는 도구일까요?', opts: ['비가 내린 양을 재는 도구', '해·달·별의 움직임을 관측하는 도구', '종을 쳐서 시간을 알리는 도구'], a: 1,
      why: '맞아요! 비를 재는 건 측우기, 종을 치는 건 자격루였죠. 혼천의는 하늘을 관측하는 도구예요.',
      hint: '혼천의의 맨 안쪽에는 별을 겨누는 망통이 있었어요. 비를 재는 건 측우기, 종을 쳐서 시간을 알리는 건 자격루였죠!' },
    { q: '별을 관측할 때 북극성이 중요한 까닭은 무엇일까요?', opts: ['하늘에서 가장 밝은 별이라서', '거의 움직이지 않고 늘 북쪽에 있어서', '달과 가장 가까워서'], a: 1,
      why: '다른 별들은 밤새 북극성을 중심으로 빙 돌지만, 북극성은 거의 그 자리에 있어요. 그래서 방향과 별의 위치를 재는 기준이 되었어요.',
      hint: '북극성은 사실 가장 밝은 별이 아니에요! 해시계의 바늘도, 혼천의의 자오환도 어느 쪽을 향했는지 떠올려 봐요.' },
  ];
  // ------------------------------------------------------------ 받침 (보너스)
  async function batchimTalk(me) {
    const s = S();
    if (s.step < 4) { await say(me, '전하께서는 학자들이 마음 놓고 책을 읽도록 휴가를 주시기도 했지.', '\'사가독서\'라고 한단다. 덕분에 공부할 맛이 나지!'); return; }
    if (s.flags.batchim) { await say(me, '첫소리 글자를 받침으로 다시 쓴다! 참 영리한 생각이지?', '덕분에 새 글자를 더 만들지 않아도 된단다.'); return; }
    await say(me, '자음과 모음을 합치는 비밀을 풀었다며? 그럼 세 번째 비밀도 알려 주마.', '"곰" 하고 말해 보거라. "고" 다음에 입술이 꾹 닫히지 않느냐?');
    const c = await ask(['고...ㅁ! 정말 입이 닫혀요!', '그럼 "곰"은 어떻게 써요?']);
    if (c === 1) await say(me, '좋은 질문이다! 바로 그걸 알려 주려던 참이었지.');
    await say(me, '말소리 끝에 붙는 소리를 \'끝소리\', 요즘 말로 \'받침\'이라 한단다.', '그런데 받침을 위한 새 글자를 또 만들어야 할까?', '아니다! 첫소리에 쓰던 자음을 아래에 한 번 더 쓰면 된단다. 이것을 \'종성부용초성\'이라 하지.');
    await say(me, '첫소리, 가운뎃소리, 끝소리를 한 덩어리로 모아 쓰는 거란다. 직접 해 보겠느냐?');
    ui.closeDialog();
    await TT.batchimGame();
    await say(me, '훌륭하다! 이제 받침 있는 글자도 척척 만드는구나.');
    ui.closeDialog();
    await TT.quiz(QUIZ_BATCHIM, '📝 받침 질문');
    s.flags.batchim = 1;
    await TT.give({ title: '⭐ 보너스 미션 완료!', shards: 10, dex: ['batchim'], text: '받침은 첫소리 자음을 다시 써요! (종성부용초성)' });
  }
  const QUIZ_BATCHIM = [
    { q: '"곰"은 ㄱ + ㅗ 다음에 받침으로 무엇을 더했을까요?', opts: ['ㄴ', 'ㅁ', 'ㅇ'], a: 1,
      why: '"고" 다음에 입술이 꾹 닫히죠? 입 모양을 본뜬 ㅁ이 받침이에요. ㄱ + ㅗ + ㅁ = 곰!',
      hint: '"곰~" 하고 천천히 말해 봐요. 마지막에 입술이 닫히나요? 입 모양을 본뜬 자음은 무엇이었죠?' },
    { q: '훈민정음에서 받침(끝소리)은 어떤 글자로 썼을까요?', opts: ['받침만을 위한 새 글자', '첫소리에 쓰던 자음을 다시 썼다', '작은 그림을 그렸다'], a: 1,
      why: '맞아요! "종성부용초성" — 끝소리는 첫소리 글자를 다시 써요. 그래서 적은 글자로 많은 소리를 적을 수 있어요.',
      hint: '글자 공방에서 받침 자리에 어떤 타일을 놓았는지 떠올려 봐요. 첫소리에 쓰던 것과 같은 자음 타일이었죠?' },
  ];
  const QUIZ_SUNDIAL = [
    { q: '앙부일구의 바늘(영침)은 어느 쪽을 향하게 놓아야 할까요?', opts: ['남쪽', '북쪽', '동쪽'], a: 1,
      why: '영침은 북쪽 하늘의 북극을 향해야 해요. 그래야 해가 움직일 때 그림자가 시각을 바르게 가리켜요.',
      hint: '해시계를 고칠 때 바늘을 어느 산 쪽으로 돌렸는지 떠올려 봐요. 궁궐 뒤에 있는 북악산은 한양의 어느 쪽에 있었죠?' },
    { q: '앙부일구에 시각을 동물 그림으로 나타낸 까닭은 무엇일까요?', opts: ['글을 모르는 백성도 시각을 알 수 있도록', '동물을 기르기 위해', '그림이 더 비싸서'], a: 0,
      why: '맞아요! 한자를 몰라도 🐴 말 그림을 보면 오시(한낮)인 걸 알 수 있었어요. 세종대왕은 시간도 모든 백성이 함께 쓰기를 바랐어요.',
      hint: '시장 사람들 이야기를 떠올려 봐요. 그때는 글을 모르는 백성이 많았죠. 그런 사람들도 시각을 알려면 어떻게 해야 할까요?' },
  ];
  const QUIZ_RAIN = [
    { q: '땅을 파서 빗물이 스며든 깊이를 재는 방법은 왜 정확하지 않았을까요?', opts: ['막대가 너무 짧아서', '흙마다 빗물이 스며드는 정도가 달라서', '비가 밤에만 와서'], a: 1,
      why: '같은 비가 와도 모래흙은 깊이, 진흙은 얕게 스며들었죠. 그래서 그릇에 빗물을 받아 재는 측우기가 필요했어요.',
      hint: '실험에서 두 밭을 막대로 재 봤던 걸 떠올려 봐요. 똑같은 비가 왔는데 모래흙과 진흙의 결과가 어땠나요?' },
    { q: '측우기는 무엇을 재는 도구일까요?', opts: ['바람의 세기', '하루의 시간', '비가 내린 양'], a: 2,
      why: '측우기는 원통 그릇에 고인 빗물의 깊이를 자(주척)로 재어 비가 내린 양을 알아냈어요.',
      hint: '이름을 잘 살펴봐요. 측(잴 측) + 우(비 우) + 기(그릇 기)! 무엇을 재는 그릇일까요?' },
  ];

  // ------------------------------------------------------------ 시작
  TT.story.intro = async function () {
    await ui.narrate([
      '✨ 우우우웅—',
      '⏳ <b>시간여행에 성공했습니다.</b>',
      '⚡ 치지직...! 하지만 <b>시간 장치가 고장났습니다.</b>',
      '원래 시간으로 돌아가려면<br>이 시대의 <b>⏳ 시간 조각</b>을 찾아야 합니다.',
    ], { flash: true });
    TT.state.step = 1;
    TT.save();
    await say(DEV, '{name}, 괜찮아? 여긴... 조선 시대, 세종대왕이 다스리던 한양이야!', '시간 조각은 이 시대의 중요한 사건 속에 숨어 있어.', '사람들을 만나서 이야기를 들어 보자. 바로 옆 수문장 아저씨한테 말을 걸어 볼까?');
    await say(DEV, '(방향키 / WASD 로 움직이고, 스페이스바로 말을 걸 수 있어!)');
  };
})();
