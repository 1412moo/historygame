"""게임 본편 대사 음성 생성기 (Typecast · 개발용 — 게임 실행 중에는 쓰이지 않음)

js/story.js 에서 확정 음성이 있는 7명(세종·장영실·상인·농부·어머니·시장 아이·똑딱이)의 대사와
시작 나레이션(ui.narrate)을 뽑아 Typecast(ssfm-v30, Smart Emotion)로 MP3를 만들고, 게임이 읽는 audio/voice/lines.js 를 만든다.
플레이어 이름({name})이 들어간 대사는 이름을 빼고 녹음한다. 목록에 없는 대사(다른 NPC, 플레이어, 안내문)는
기존 브라우저 읽어주기로 읽힌다.

API 키는 TYPECAST_API_KEY 환경 변수에서만 읽는다 (voice_compare.py 와 같은 attribution User-Agent 사용).

사용법:
    python tools/typecast_game_voice.py extract    # 대사 목록만 뽑아 tools/game_voice_lines.json 으로 저장 (API 호출 없음)
    python tools/typecast_game_voice.py generate   # 없는 파일만 생성 (기존 오디션 샘플은 복사해 재사용) + lines.js
    python tools/typecast_game_voice.py manifest   # audio/voice/lines.js 만 다시 만들기
"""
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import voice_compare as vc  # noqa: E402  (http, tc_headers, TC 재사용)
import cache_bust  # noqa: E402  (lines.js 가 바뀌면 index.html 의 ?v= 도 갱신)

ROOT = vc.ROOT
STORY = ROOT / "js" / "story.js"
LIST_FILE = ROOT / "tools" / "game_voice_lines.json"
OUT = ROOT / "audio" / "voice"
SAMPLES = ROOT / "audio" / "voice-samples" / "typecast"

# 확정 음성 (2026-10 오디션 결과)
VOICES = {
    "sejong": ("tc_60ad08c829e878c3c7d73965", "창배 Changbae"),
    "jang": ("tc_636b1d93b58379d5c6b6aef7", "상훈 Sanghoon"),
    "merchant": ("tc_681c180fcc90c099ccc79aeb", "영목 Youngmok"),
    "farmer": ("tc_5c3c52c95827e00008dd7f34", "덕춘 Duckchun"),
    "mother": ("tc_684a7a1446e2a628b5b07230", "재선 Jaesun"),
    "child": ("tc_66596206b7bd6e89c3a2c54e", "아찌 Azzi"),
    "device": ("tc_663c689ada7bbd7f8f1a788a", "로로 Roro"),
    # 나레이션 전용 (ui.narrate). 캐릭터 음성과 성별·나이대가 겹치지 않는 오디오북/스토리텔링 계열
    "narrator": ("tc_6731b3ac075b04a944644234", "한영 Hanyoung"),
    # 집현전 학자 대표 (scholar_head): 따뜻하고 지적인 중년 선생님 — 2026-10 오디션에서 확정
    "scholar": ("tc_6731b2e0855f351b98d30c48", "건석 Gunseok"),
    # 대사가 2~3줄인 NPC: 오디션 없이 1순위 후보로 생성 (2026-10 P1-1)
    "apprentice": ("tc_64e72df02909019ec5b8acdd", "경수 Kyungsoo"),
    "potter": ("tc_606c6c684085209e5555abb0", "곽두필 Dupil"),
    "helper": ("tc_6059dad0b83880769a50502f", "박창수 Changsu"),
    "grandma": ("tc_60ad0841061ee28740ec2e1c", "순이 Sooni"),
    "boy": ("tc_6699eb3849dfac016c29444c", "시우 Siwoo"),
    "official1": ("tc_653220349ba8419521ae8a63", "재준 Jaejun"),
    "official2": ("tc_5fe06471a9f79e8f959be96f", "성호 Sungho"),
    "scholar_b": ("tc_61945d9c2c11c2c9fd934340", "일호 Ilho"),
}
NAME = "{name}"  # 플레이어 이름 자리: 음성에서는 이름을 빼고 읽고, 게임은 이름이 들어간 화면 글자와 맞춰 재생한다
# story.js 안의 위치(NPC id 또는 함수 이름) → `me` 가 가리키는 화자
CONTEXT_SPEAKER = {"merchant": "merchant", "farmer": "farmer", "mother": "mother", "girl": "child",
                   "sejongTalk": "sejong", "jangTalk": "jang", "rainTalk": "jang", "scholarTalk": "scholar",
                   **{k: k for k in ("apprentice", "potter", "helper", "grandma", "boy", "official1", "official2", "scholar_b")}}
# 오디션 때 확정 음성·같은 대사로 이미 만든 샘플 (voice_lines.json 의 id → 파일, 다시 생성하지 않고 복사)
# sejong_name 은 샘플이 다른 음성(종대)이라 새로 만든다.
REUSE = {
    "sejong_resolve": "sejong_resolve__changbae.mp3", "jang_intro": "jang_intro__sanghoon.mp3", "merchant_ledger": "merchant_ledger.mp3",
    "farmer_notice": "farmer_notice.mp3", "mother_son": "mother_son.mp3", "child_read": "child_read.mp3", "device_hint": "device_hint.mp3",
}
# 읽기만 바꾸는 대사 (화면 글자는 그대로)
TTS_OVERRIDE = {
    "(방향키 / WASD 로 움직이고, 스페이스바로 말을 걸 수 있어!)": "방향키나 W, A, S, D 로 움직이고, 스페이스바로 말을 걸 수 있어!",
    # 길게 끄는 소리(~)는 모음을 겹쳐 읽는다
    "옹기 사시오~! 옹기는 숨을 쉬는 그릇이라 된장, 간장 담기에 딱이라오.": "옹기 사시오오! 옹기는 숨을 쉬는 그릇이라 된장, 간장 담기에 딱이라오.",
    "쉬운 글자가 있으면 좋겠다~": "쉬운 글자가 있으면 좋겠다아.",
    # 한글 교육 표현: 자모·기호는 사람이 듣는 한국어로 풀어 읽는다
    "자, '그' 하고 소리 내 보거라. 혀뿌리가 목구멍을 막지 않느냐?": "자, 그으, 하고 소리 내 보거라. 혀뿌리가 목구멍을 막지 않느냐?",
    "첫 번째 비밀: 소리 합치기. 자음 <b>ㄱ</b> 을 누르고, 모음 <b>ㅏ</b> 를 눌러 합쳐 보세요!":
        "첫 번째 비밀, 소리 합치기. 자음 기역을 누르고, 모음 아를 눌러 합쳐 보세요!",
    "두 번째 비밀: 모음 바꾸기. <b>ㅁ</b> 하나로 세 가지 소리를! 모음만 바꿔 보세요.":
        "두 번째 비밀, 모음 바꾸기. 미음 하나로 세 가지 소리를! 모음만 바꿔 보세요.",
}
# 정보 카드 (ui.card): 카드 안 글자(textContent, 공백 정리)가 열쇠. 제목 문구로 카드를 찾아 읽기 텍스트를 붙인다
CARD_TTS = {
    "자음(닿소리)의 비밀": "자음, 닿소리의 비밀. 기역은 혀뿌리가 목구멍을 막는 모양. 니은은 혀끝이 윗잇몸에 닿는 모양. 미음은 입 모양. "
                    "시옷은 이, 그러니까 치아 모양. 이응은 목구멍 모양. 여기에 획을 더하면 키읔, 디귿, 비읍, 지읒, 히읗 같은 글자가 생겨요!",
    "모음(홀소리)의 비밀": "모음, 홀소리의 비밀. 둥근 점은 둥근 하늘. 모음 으는 평평한 땅. 모음 이는 서 있는 사람. "
                    "이 셋을 합쳐 아, 어, 오, 우 같은 모음을 만들어요. 예를 들어, 이에 둥근 점을 더하면 아가 돼요.",
}
MINIGAMES = ROOT / "js" / "minigames.js"

STR_RE = re.compile(r"'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`")


def js_strings(s):
    out = []
    for m in STR_RE.finditer(s):
        if m.group(1) is not None:
            out.append(re.sub(r"\\(.)", r"\1", m.group(1)))
        else:
            out.append(m.group(2).replace("${n}", "1"))  # afterStory: 이 대사가 나올 때 n 은 항상 1
    return out


def clean(t):
    """js/voice.js 의 clean() 과 같은 규칙 (한자·이모지·괄호 기호 정리)"""
    t = t.replace(NAME + ", ", "").replace(NAME, "")
    t = re.sub(r"<br\s*/?>", " ", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = re.sub(r"\(\s*[㐀-鿿\s]+\)", "", t)
    t = re.sub(r"[㐀-鿿]+", "", t)
    t = re.sub(r"[\U0001F000-\U0001FAFF⌀-⏿☀-➿⭐️‍]", "", t)
    t = re.sub(r"[「」『』\"“”]", "", t)
    t = re.sub(r"[~—]", " ", t)
    t = re.sub(r"\(\s*\d/\d\)", "", t)
    t = t.replace("( ", "(").replace("·", " ")
    return re.sub(r"\s+", " ", t).strip()


def card_key(html):
    """js/ui.js ui.card 와 같은 열쇠: 카드 HTML 의 textContent(태그 제거, 공백 정리). 화면 배치(innerText)와 무관하다"""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html)).strip()


def extra_lines():
    """대화가 아닌 나레이션 음성: 정보 카드(story.js ui.card)와 한글 공방 라운드 안내(minigames.js ROUNDS)"""
    story = STORY.read_text(encoding="utf-8")
    for m in re.finditer(r"ui\.card\(`((?:[^`\\]|\\.)*)`", story):
        key = card_key(m.group(1))
        tts = next((t for mark, t in CARD_TTS.items() if mark in key), None)
        if tts:
            yield "narrator", key, f"js/story.js:{story[:m.start()].count(chr(10)) + 1}", tts
    mg = MINIGAMES.read_text(encoding="utf-8")
    start = mg.index("const ROUNDS = [")
    block = mg[start:mg.index("];", start)]
    for m in re.finditer(r"\{ title: '([^']*)', intro: '([^']*)'", block):
        key = f"{m.group(1)}. {m.group(2)}"  # minigames.js 가 음성에 넘기는 문자열 그대로: `${R.title}. ${R.intro}`
        yield "narrator", key, f"js/minigames.js:{mg[:start + m.start()].count(chr(10)) + 1}", TTS_OVERRIDE.get(key, clean(key))


def extract():
    ctx, groups, cur, narr = None, [], None, False
    for no, line in enumerate(STORY.read_text(encoding="utf-8").splitlines(), 1):
        m = re.search(r"\bid: '(\w+)'", line) or re.search(r"async function (\w+)\(", line)
        if m:
            ctx = m.group(1)
            cur = None
        # 나레이션: ui.narrate([ ... ]) 안의 문장 (화면 글자 그대로가 대사 키)
        if "ui.narrate([" in line:
            narr = True
            cur = {"ctx": "narrate", "items": []}
            groups.append(cur)
            continue
        if narr:
            if line.strip().startswith("]"):
                narr, cur = False, None
            else:
                cur["items"] += [("narrator", t, no) for t in js_strings(line)]
            continue
        call = re.search(r"say\((me|DEV),", line)
        react = ctx == "sejongTalk" and "const react" in line
        if not call and not react:
            continue
        spk = "device" if call and call.group(1) == "DEV" else CONTEXT_SPEAKER.get(ctx)
        if not spk:
            continue
        texts = js_strings(line[call.end():] if call else line)
        if cur is None or cur["ctx"] != ctx:
            cur = {"ctx": ctx, "items": []}
            groups.append(cur)
        cur["items"] += [(spk, t, no) for t in texts]
        if "return;" in line:  # `if (...) { say(...); return; }` 처럼 따로 끝나는 분기는 다음 대사와 문맥을 잇지 않는다
            cur = None
    seen, out = set(), []
    for g in groups:
        items = g["items"]
        for i, (spk, text, no) in enumerate(items):
            if text in seen:
                continue
            seen.add(text)
            tts = TTS_OVERRIDE.get(text, clean(text))
            ln = {"id": f"{spk}_{hashlib.sha1(text.encode()).hexdigest()[:8]}", "speaker": spk, "text": text, "tts_text": tts,
                  "source": f"js/story.js:{no}",
                  "prev": clean(items[i - 1][1]) if i > 0 else "",
                  "next": clean(items[i + 1][1]) if i + 1 < len(items) else ""}
            out.append(ln)
    for spk, text, src, tts in extra_lines():
        if text not in seen:
            seen.add(text)
            out.append({"id": f"{spk}_{hashlib.sha1(text.encode()).hexdigest()[:8]}", "speaker": spk, "text": text, "tts_text": tts,
                        "source": src, "prev": "", "next": ""})
    LIST_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    by = {}
    for ln in out:
        by.setdefault(ln["speaker"], []).append(len(ln["tts_text"]))
    for spk, ns in by.items():
        print(f"{spk:9s} {VOICES[spk][1]:14s} {len(ns):3d}개  {sum(ns):5d}자")
    print(f"합계 {len(out)}개, {sum(len(l['tts_text']) for l in out)}자 → {LIST_FILE.relative_to(ROOT)}")
    return out


def sample_texts():
    """오디션 샘플이 만들어진 대사 텍스트 (voice_lines.json) — 재사용 판단용"""
    return {ln["text"]: ln for ln in vc.lines()}


def generate():
    lines = extract()
    OUT.mkdir(parents=True, exist_ok=True)
    samples = sample_texts()
    made = copied = chars = 0
    for ln in lines:
        path = OUT / f"{ln['id']}.mp3"
        if path.exists():
            continue
        sid = (samples.get(ln["text"]) or {}).get("id")
        src = sid in REUSE and SAMPLES / REUSE[sid]
        if src and src.exists():
            shutil.copyfile(src, path)
            copied += 1
            print(f"재사용 {src.name} → {path.name}")
            continue
        voice_id, voice_name = VOICES[ln["speaker"]]
        prompt = {"emotion_type": "smart"}
        if ln["prev"]:
            prompt["previous_text"] = ln["prev"]
        if ln["next"]:
            prompt["next_text"] = ln["next"]
        body = {"model": "ssfm-v30", "voice_id": voice_id, "text": ln["tts_text"], "language": "kor", "prompt": prompt,
                "output": {"audio_format": "mp3", "target_lufs": -16}}
        path.write_bytes(vc.http("POST", f"{vc.TC}/v1/text-to-speech", dict(vc.tc_headers(), Accept="audio/mpeg"), body=body, raw=True))
        made += 1
        chars += len(ln["tts_text"])
        print(f"생성 {path.name}  {voice_name}  ({len(ln['tts_text'])}자)")
    print(f"이번 실행: 생성 {made}개 ({chars}자), 샘플 재사용 {copied}개")
    manifest()


def manifest():
    lines = json.loads(LIST_FILE.read_text(encoding="utf-8"))
    # ?v= 는 MP3 내용 기준 버전: 같은 이름으로 다시 만들어도 휴대폰이 예전 파일(Pages 10분 캐시)을 쓰지 않게 한다
    data = []
    for ln in lines:
        if not (OUT / f"{ln['id']}.mp3").exists():
            continue
        d = {"text": ln["text"], "audio": f"audio/voice/{ln['id']}.mp3?v={cache_bust.file_version(OUT / (ln['id'] + '.mp3'))}",
             "speaker": ln["speaker"], "voice": VOICES[ln["speaker"]][1]}
        if ln["tts_text"] != clean(ln["text"]):
            d["say"] = ln["tts_text"]  # 읽기 텍스트를 따로 정한 대사: MP3를 못 불러올 때 브라우저 읽어주기도 이 문장으로 읽는다
        data.append(d)
    (OUT / "lines.js").write_text(
        "// 게임 대사 음성 (Typecast로 개발 중에 미리 만든 MP3). tools/typecast_game_voice.py 가 만든 파일 — 직접 고치지 마세요.\n"
        "window.TT_VOICE_LINES = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"audio/voice/lines.js: {len(data)} / {len(lines)}개 연결")
    cache_bust.main()


if __name__ == "__main__":
    {"extract": extract, "generate": generate, "manifest": manifest}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
