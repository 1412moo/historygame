"""음성 비교 샘플 생성기 (개발용 · 게임 실행 중에는 쓰이지 않음)

tools/voice_lines.json 의 대표 대사 8개를 여러 TTS로 만들어 audio/voice-samples/<엔진>/ 에 저장하고,
?dev 비교 패널이 읽는 audio/voice-samples/compare.js 를 만든다.

API 키는 코드/파일에 저장하지 않고 환경 변수에서만 읽는다.
    TYPECAST_API_KEY, GEMINI_API_KEY, ELEVENLABS_API_KEY

사용법:
    python tools/voice_compare.py edge             # Edge TTS (무료, 키 없음)
    python tools/voice_compare.py elevenlabs       # 빠진 대사만 ElevenLabs 무료 기본 음성으로
    python tools/voice_compare.py typecast-voices  # Typecast 라이브러리에서 캐릭터별 후보 찾기 (성별·나이 필터)
    python tools/voice_compare.py typecast-recommend  # Typecast 자연어 추천 + /v3/voices 로 확인 (공식 권장)
    python tools/voice_compare.py typecast         # Typecast 생성 (voice_lines.json 의 typecast.voice_id 사용)
    python tools/voice_compare.py typecast-audition  # Typecast 재오디션 후보 (typecast.audition) 생성
    python tools/voice_compare.py typecast-usage   # Typecast 남은 크레딧
    python tools/voice_compare.py gemini           # Gemini TTS 생성
    python tools/voice_compare.py manifest         # 비교 패널용 compare.js 다시 만들기
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINES_FILE = ROOT / "tools" / "voice_lines.json"
OUT = ROOT / "audio" / "voice-samples"
ENGINES = ["edge", "elevenlabs", "typecast", "gemini"]


def lines():
    return json.loads(LINES_FILE.read_text(encoding="utf-8"))


def env_key(name):
    k = os.environ.get(name, "").strip()
    if not k:
        sys.exit(f"{name} 환경 변수가 없습니다. 본인 터미널에서 setx {name} \"키\" 실행 후 앱을 다시 시작하세요.")
    return k


def http(method, url, headers, body=None, raw=False, retries=3):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=data, method=method, headers=dict({"Content-Type": "application/json"}, **headers))
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                out = r.read()
                return out if raw else json.loads(out)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:600]
            if e.code == 429 and attempt < retries - 1:
                print(f"  · 요청 한도(429) — {20 * (attempt + 1)}초 뒤 다시 시도")
                time.sleep(20 * (attempt + 1))
                continue
            sys.exit(f"API 오류 {e.code}: {msg}")


def tts_text(line):
    return line.get("tts_text", line["text"])


# ------------------------------------------------------------------ Edge TTS
def cmd_edge():
    import asyncio
    import edge_tts

    async def run():
        (OUT / "edge").mkdir(parents=True, exist_ok=True)
        for ln in lines():
            e = ln["edge"]
            path = OUT / "edge" / f"{ln['id']}.mp3"
            await edge_tts.Communicate(tts_text(ln), e["voice"], rate=e["rate"], pitch=e["pitch"]).save(str(path))
            print(f"edge/{path.name}  {e['voice']}")
    asyncio.run(run())
    cmd_manifest()


# ------------------------------------------------------------------ ElevenLabs (빠진 대사만)
def existing_elevenlabs():
    """기존 elevenlabs/samples.js 에서 대사 텍스트 → 파일 (게임용 in_game 우선)"""
    f = OUT / "elevenlabs" / "samples.js"
    if not f.exists():
        return {}
    data = json.loads(f.read_text(encoding="utf-8").split("=", 1)[1].rstrip().rstrip(";"))
    m = {}
    for s in sorted(data, key=lambda s: not s.get("in_game")):
        m.setdefault(s["text"], {"audio": s["audio"], "voice": s.get("voice_name")})
    return m


def cmd_elevenlabs():
    have = existing_elevenlabs()
    key = env_key("ELEVENLABS_API_KEY")
    for ln in lines():
        if ln["text"] in have or "elevenlabs" not in ln or (OUT / "elevenlabs" / f"{ln['id']}.mp3").exists():
            continue
        cfg = ln["elevenlabs"]
        audio = http("POST", f"https://api.elevenlabs.io/v1/text-to-speech/{cfg['voice_id']}?output_format=mp3_44100_128",
                     {"xi-api-key": key, "Accept": "audio/mpeg"}, raw=True,
                     body={"text": tts_text(ln), "model_id": "eleven_multilingual_v2", "language_code": "ko", "voice_settings": cfg["voice_settings"]})
        (OUT / "elevenlabs" / f"{ln['id']}.mp3").write_bytes(audio)
        print(f"elevenlabs/{ln['id']}.mp3  {cfg['voice_name']}  ({len(tts_text(ln))}자)")
    cmd_manifest()


# ------------------------------------------------------------------ Typecast
TC = "https://api.typecast.ai"


TC_USER_AGENT = "typecast-direct/1 python-urllib typecast-integration/1 (source=api-docs; generated_by=claude-code)"  # Typecast llms.txt 코딩 에이전트 attribution 규칙


def tc_headers():
    return {"X-API-KEY": env_key("TYPECAST_API_KEY"), "User-Agent": TC_USER_AGENT}


def cmd_typecast_recommend():
    """공식 권장 방식: 자연어로 추천받은 뒤 /v3/voices/{id} 로 실제 속성을 확인한다."""
    out = {}
    for ln in lines():
        q = ln["typecast"].get("query")
        if not q:
            continue
        recs = http("GET", f"{TC}/v1/voices/recommendations?" + urllib.parse.urlencode({"query": q, "model": "ssfm-v30"}), tc_headers())
        recs = recs.get("voices", recs) if isinstance(recs, dict) else recs
        print(f"\n## {ln['label']}  — \"{q}\"")
        for r in recs[:6]:
            v = http("GET", f"{TC}/v3/voices/{r['voice_id']}", tc_headers())
            print(json.dumps({"voice_id": v.get("voice_id"), "name": v.get("voice_name"), "gender": v.get("gender"), "age": v.get("age"),
                              "use_cases": v.get("use_cases"), "models": [m.get("version") for m in (v.get("models") or [])], "score": r.get("score")}, ensure_ascii=False))
            out.setdefault(ln["id"], []).append(v)
    (Path(os.environ.get("TEMP", ".")) / "typecast_recommend.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")


def cmd_typecast_voices():
    seen = {}
    for ln in lines():
        t = ln["typecast"]
        print(f"\n## {ln['label']}  ({t['gender']}, {', '.join(t['age'])})")
        for age in t["age"]:
            q = urllib.parse.urlencode({"model": "ssfm-v30", "gender": t["gender"], "age": age})
            for v in http("GET", f"{TC}/v3/voices?{q}", tc_headers()):
                seen[v["voice_id"]] = v
                print(json.dumps({k: v.get(k) for k in ("voice_id", "voice_name", "age", "use_cases", "emotions")}, ensure_ascii=False))
    (Path(os.environ.get("TEMP", ".")) / "typecast_voices.json").write_text(json.dumps(list(seen.values()), ensure_ascii=False, indent=1), encoding="utf-8")


def cmd_typecast_usage():
    s = http("GET", f"{TC}/v1/users/me/subscription", tc_headers())
    print(json.dumps(s, ensure_ascii=False))


def cmd_typecast():
    (OUT / "typecast").mkdir(parents=True, exist_ok=True)
    total = 0
    for ln in lines():
        t = ln["typecast"]
        if not t.get("voice_id"):
            sys.exit(f"{ln['id']}: typecast.voice_id 가 아직 정해지지 않았습니다 (typecast-voices 로 먼저 고르기)")
        prompt = {"emotion_type": "smart"}
        if ln.get("prev"):
            prompt["previous_text"] = ln["prev"]
        if ln.get("next"):
            prompt["next_text"] = ln["next"]
        body = {"model": "ssfm-v30", "voice_id": t["voice_id"], "text": tts_text(ln), "language": "kor", "prompt": prompt,
                "output": {"audio_format": "mp3", "audio_tempo": t.get("tempo", 1.0), "audio_pitch": t.get("pitch", 0), "target_lufs": -16}}
        audio = http("POST", f"{TC}/v1/text-to-speech", dict(tc_headers(), Accept="audio/mpeg"), body=body, raw=True)
        (OUT / "typecast" / f"{ln['id']}.mp3").write_bytes(audio)
        total += len(tts_text(ln))
        print(f"typecast/{ln['id']}.mp3  {t.get('voice_name')}  smart emotion  ({len(tts_text(ln))}자)")
    print(f"대사 글자 수 합계: {total}")
    cmd_manifest()


def cmd_typecast_audition():
    """재오디션: voice_lines.json 의 typecast.audition 후보를 같은 대사로 생성 (기존 파일은 덮어쓰지 않음)."""
    total = 0
    for ln in lines():
        au = ln["typecast"].get("audition")
        if not au:
            continue
        prompt = {"emotion_type": "smart"}
        if au.get("prev"):
            prompt["previous_text"] = au["prev"]
        if au.get("next"):
            prompt["next_text"] = au["next"]
        for v in au["voices"]:
            path = OUT / "typecast" / f"{ln['id']}__{v['slug']}.mp3"
            if path.exists():
                print(f"건너뜀(이미 있음): {path.name}")
                continue
            body = {"model": "ssfm-v30", "voice_id": v["voice_id"], "text": tts_text(ln), "language": "kor", "prompt": prompt,
                    "output": {"audio_format": "mp3", "target_lufs": -16}}
            path.write_bytes(http("POST", f"{TC}/v1/text-to-speech", dict(tc_headers(), Accept="audio/mpeg"), body=body, raw=True))
            total += len(tts_text(ln))
            print(f"typecast/{path.name}  {v['voice_name']}  smart emotion (문맥 앞 {len(au.get('prev', ''))}자 / 뒤 {len(au.get('next', ''))}자)")
    print(f"이번에 생성한 대사 글자 수: {total}")
    cmd_manifest()


# ------------------------------------------------------------------ Gemini TTS
GEMINI_MODEL = "gemini-3.8-flash-tts"


def find_audio(obj):
    """Interactions API 응답에서 base64 오디오를 찾는다 (마지막 audio 조각)."""
    found = []

    def walk(o):
        if isinstance(o, dict):
            if o.get("type") == "audio" and isinstance(o.get("data"), str):
                found.append(o)
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(obj)
    return found[-1] if found else None


def cmd_gemini():
    key = env_key("GEMINI_API_KEY")
    (OUT / "gemini").mkdir(parents=True, exist_ok=True)
    for i, ln in enumerate(lines()):
        g = ln["gemini"]
        body = {
            "model": GEMINI_MODEL,
            "input": [{"type": "user_input", "content": [{"type": "text", "text": tts_text(ln),
                       "annotations": [{"type": "speech_metadata", "style": g["style"]}]}]}],
            "response_format": {"type": "audio", "mime_type": "audio/wav", "sample_rate": 24000},
            "generation_config": {"speech_config": [{"voice": g["voice"]}]},
        }
        res = http("POST", "https://generativelanguage.googleapis.com/v1beta/interactions", {"x-goog-api-key": key}, body=body)
        a = find_audio(res)
        if not a:
            dbg = Path(os.environ.get("TEMP", ".")) / "gemini_last_response.json"
            dbg.write_text(json.dumps(res, ensure_ascii=False)[:20000], encoding="utf-8")
            sys.exit(f"{ln['id']}: 응답에서 오디오를 찾지 못했습니다 (응답 구조: {dbg})")
        wav = base64.b64decode(a["data"])
        if wav[:4] != b"RIFF":  # 헤더 없는 PCM이면 WAV 헤더를 붙인다 (24kHz, 16bit, mono)
            import struct
            n = len(wav)
            wav = b"RIFF" + struct.pack("<I", 36 + n) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, 24000, 48000, 2, 16) + b"data" + struct.pack("<I", n) + wav
        (OUT / "gemini" / f"{ln['id']}.wav").write_bytes(wav)
        print(f"gemini/{ln['id']}.wav  {g['voice']}  ({len(wav) // 1024} KB)")
        if i < len(lines()) - 1:
            time.sleep(7)  # 무료 등급 분당 요청 한도 여유
    cmd_manifest()


# ------------------------------------------------------------------ 비교 패널 manifest
def cmd_manifest():
    el = existing_elevenlabs()
    files = {e: {} for e in ENGINES}
    meta = {e: {} for e in ENGINES}
    for ln in lines():
        lid = ln["id"]
        for e in ENGINES:
            for ext in ("mp3", "wav"):
                p = OUT / e / f"{lid}.{ext}"
                if p.exists():
                    files[e][lid] = p.relative_to(ROOT).as_posix()
        if lid not in files["elevenlabs"] and ln["text"] in el:
            files["elevenlabs"][lid] = el[ln["text"]]["audio"]
        meta["edge"][lid] = ln["edge"]["voice"].replace("ko-KR-", "").replace("Neural", "")
        meta["elevenlabs"][lid] = (ln.get("elevenlabs") or {}).get("voice_name") or (el.get(ln["text"]) or {}).get("voice") or ""
        meta["typecast"][lid] = f"{ln['typecast'].get('voice_name', '')} · Smart Emotion"
        meta["gemini"][lid] = f"{ln['gemini']['voice']} · {GEMINI_MODEL}"
    # 재오디션 후보 (같은 대사, 다른 음성) — 패널에서 추가 버튼으로 표시
    alts = {"typecast": {}}
    for ln in lines():
        for v in (ln["typecast"].get("audition") or {}).get("voices", []):
            p = OUT / "typecast" / f"{ln['id']}__{v['slug']}.mp3"
            if p.exists():
                alts["typecast"].setdefault(ln["id"], []).append({"audio": p.relative_to(ROOT).as_posix(), "label": v["voice_name"], "why": v.get("why", "")})
    data = {"lines": [{k: ln[k] for k in ("id", "npc", "label", "text")} for ln in lines()], "files": files, "meta": meta, "alts": alts}
    (OUT / "compare.js").write_text("window.TT_VOICE_COMPARE = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print("compare.js: " + ", ".join(f"{e} {len(files[e])}개" for e in ENGINES) + f", typecast 재오디션 {sum(len(v) for v in alts['typecast'].values())}개")


if __name__ == "__main__":
    cmds = {"edge": cmd_edge, "elevenlabs": cmd_elevenlabs, "typecast-voices": cmd_typecast_voices, "typecast-recommend": cmd_typecast_recommend, "typecast-audition": cmd_typecast_audition, "typecast": cmd_typecast,
            "typecast-usage": cmd_typecast_usage, "gemini": cmd_gemini, "manifest": cmd_manifest}
    cmds.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
