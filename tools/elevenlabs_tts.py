"""ElevenLabs 한국어 음성 생성 (개발용 도구 · 게임 실행 중에는 쓰이지 않음)

API 키는 코드나 프로젝트 파일에 저장하지 않는다.
Windows 사용자 환경 변수 ELEVENLABS_API_KEY 에서만 읽는다.
    setx ELEVENLABS_API_KEY "발급받은_키"   (본인 터미널에서 실행 후 앱 재시작)

사용법:
    python tools/elevenlabs_tts.py check                # 키 동작 확인 (키 값은 출력하지 않음)
    python tools/elevenlabs_tts.py voices               # 음성 라이브러리에서 한국어 음성 후보 목록
    python tools/elevenlabs_tts.py samples              # tools/elevenlabs_samples.json 의 샘플 대사 생성
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://api.elevenlabs.io"
SAMPLE_CONFIG = ROOT / "tools" / "elevenlabs_samples.json"
SAMPLE_OUT = ROOT / "audio" / "voice-samples" / "elevenlabs"


def key():
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not k:
        sys.exit("ELEVENLABS_API_KEY 환경 변수가 없습니다. 본인 터미널에서 setx 로 설정한 뒤 앱을 다시 시작하세요.")
    return k


def request(method, path, body=None, params=None, raw=False):
    url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "xi-api-key": key(),
        "Content-Type": "application/json",
        "Accept": "audio/mpeg" if raw else "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            out = r.read()
            return out if raw else json.loads(out)
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "replace")[:500]
        sys.exit(f"ElevenLabs API 오류 {e.code}: {msg}")


def cmd_check():
    u = request("GET", "/v1/user/subscription")
    left = u.get("character_limit", 0) - u.get("character_count", 0)
    print(f"키 정상 · 요금제: {u.get('tier')} · 이번 달 남은 글자 수: {left} / {u.get('character_limit')}")


def cmd_voices():
    res = request("GET", "/v1/shared-voices", params={"language": "ko", "page_size": 100})
    for v in res.get("voices", []):
        print(json.dumps({k: v.get(k) for k in ("voice_id", "public_owner_id", "name", "gender", "age", "accent", "descriptive", "use_case", "description")}, ensure_ascii=False))
    mine = request("GET", "/v2/voices", params={"page_size": 100})
    print("\n# 내 음성 목록")
    for v in mine.get("voices", []):
        print(json.dumps({"voice_id": v["voice_id"], "name": v["name"], "labels": v.get("labels")}, ensure_ascii=False))


def ensure_in_library(s):
    """라이브러리(공유) 음성은 API로 쓰기 전에 내 음성 목록에 추가해야 한다."""
    if not s.get("public_owner_id"):
        return
    mine = {v["voice_id"] for v in request("GET", "/v2/voices", params={"page_size": 100}).get("voices", [])}
    if s["voice_id"] in mine:
        return
    request("POST", f"/v1/voices/add/{s['public_owner_id']}/{s['voice_id']}", body={"new_name": s.get("voice_name") or s["id"]})
    print(f"  · 내 음성 목록에 추가: {s.get('voice_name') or s['voice_id']}")


def cmd_samples():
    samples = json.loads(SAMPLE_CONFIG.read_text(encoding="utf-8"))
    SAMPLE_OUT.mkdir(parents=True, exist_ok=True)
    for s in samples:
        ensure_in_library(s)
        audio = request("POST", f"/v1/text-to-speech/{s['voice_id']}", raw=True,
                        params={"output_format": "mp3_44100_128"},
                        body={"text": s.get("tts_text", s["text"]), "model_id": s.get("model_id", "eleven_multilingual_v2"),
                              "language_code": "ko", "voice_settings": s.get("voice_settings", {})})
        path = SAMPLE_OUT / f"{s['id']}.mp3"
        path.write_bytes(audio)
        s["audio"] = path.relative_to(ROOT).as_posix()
        print(f"{path.name}  {s.get('voice_name', s['voice_id'])}  ({len(audio) // 1024} KB)")
    public = [{k: s[k] for k in ("id", "speaker", "label", "text", "audio", "voice_name", "note", "in_game") if k in s} for s in samples]
    (SAMPLE_OUT / "samples.js").write_text("window.TT_VOICE_SAMPLES_EL = " + json.dumps(public, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")


if __name__ == "__main__":
    {"check": cmd_check, "voices": cmd_voices, "samples": cmd_samples}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
