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
}
NAME = "{name}"  # 플레이어 이름 자리: 음성에서는 이름을 빼고 읽고, 게임은 이름이 들어간 화면 글자와 맞춰 재생한다
# story.js 안의 위치(NPC id 또는 함수 이름) → `me` 가 가리키는 화자
CONTEXT_SPEAKER = {"merchant": "merchant", "farmer": "farmer", "mother": "mother", "girl": "child",
                   "sejongTalk": "sejong", "jangTalk": "jang", "rainTalk": "jang"}
# 오디션 때 확정 음성·같은 대사로 이미 만든 샘플 (voice_lines.json 의 id → 파일, 다시 생성하지 않고 복사)
# sejong_name 은 샘플이 다른 음성(종대)이라 새로 만든다.
REUSE = {
    "sejong_resolve": "sejong_resolve__changbae.mp3", "jang_intro": "jang_intro__sanghoon.mp3", "merchant_ledger": "merchant_ledger.mp3",
    "farmer_notice": "farmer_notice.mp3", "mother_son": "mother_son.mp3", "child_read": "child_read.mp3", "device_hint": "device_hint.mp3",
}
# 읽기만 바꾸는 대사 (화면 글자는 그대로)
TTS_OVERRIDE = {
    "(방향키 / WASD 로 움직이고, 스페이스바로 말을 걸 수 있어!)": "방향키나 W, A, S, D 로 움직이고, 스페이스바로 말을 걸 수 있어!",
}

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
    data = [{"text": ln["text"], "audio": f"audio/voice/{ln['id']}.mp3?v={cache_bust.file_version(OUT / (ln['id'] + '.mp3'))}",
             "speaker": ln["speaker"], "voice": VOICES[ln["speaker"]][1]}
            for ln in lines if (OUT / f"{ln['id']}.mp3").exists()]
    (OUT / "lines.js").write_text(
        "// 게임 대사 음성 (Typecast로 개발 중에 미리 만든 MP3). tools/typecast_game_voice.py 가 만든 파일 — 직접 고치지 마세요.\n"
        "window.TT_VOICE_LINES = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"audio/voice/lines.js: {len(data)} / {len(lines)}개 연결")
    cache_bust.main()


if __name__ == "__main__":
    {"extract": extract, "generate": generate, "manifest": manifest}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
