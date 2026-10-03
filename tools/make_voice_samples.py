"""Edge TTS 한국어 음성 샘플 생성 (개발용 · API 키 불필요)

실행:  python -m pip install edge-tts
       python tools/make_voice_samples.py

결과: audio/voice-samples/*.mp3 + samples.json (게임의 음성 샘플 패널이 읽음)
"""
import asyncio
import json
from pathlib import Path

import edge_tts

OUT = Path(__file__).resolve().parent.parent / "audio" / "voice-samples"

# 사용 가능한 한국어 음성 (edge-tts --list-voices 로 확인):
#   ko-KR-InJoonNeural (남), ko-KR-HyunsuMultilingualNeural (남), ko-KR-SunHiNeural (여)
SAMPLES = [
    {"id": "sejong_1", "speaker": "세종대왕", "text": "백성들이 글을 몰라 어려움을 겪고 있구나.",
     "voice": "ko-KR-InJoonNeural", "rate": "-12%", "pitch": "-8Hz", "note": "차분하고 낮게"},
    {"id": "sejong_2", "speaker": "세종대왕", "text": "우리 백성들이 쉽게 익혀 날마다 편히 쓰게 하려 하노라.",
     "voice": "ko-KR-InJoonNeural", "rate": "-12%", "pitch": "-8Hz", "note": "차분하고 낮게"},
    {"id": "jangyeongsil", "speaker": "장영실", "text": "전하! 새로운 물시계를 완성했습니다!",
     "voice": "ko-KR-HyunsuMultilingualNeural", "rate": "+5%", "pitch": "+0Hz", "note": "밝고 약간 빠르게"},
    {"id": "merchant", "speaker": "상인", "text": "어서 오시오! 좋은 물건이 많소.",
     "voice": "ko-KR-InJoonNeural", "rate": "+6%", "pitch": "+3Hz", "note": "활기차게 (세종과 같은 기본 음성)"},
    {"id": "farmer", "speaker": "농부", "text": "요즘 농사일이 참 쉽지 않구려.",
     "voice": "ko-KR-HyunsuMultilingualNeural", "rate": "-8%", "pitch": "-4Hz", "note": "소박하고 느긋하게"},
    {"id": "child", "speaker": "어린이", "text": "전하, 저도 글을 배울 수 있나요?",
     "voice": "ko-KR-SunHiNeural", "rate": "+4%", "pitch": "+25Hz", "note": "어린이 전용 음성이 없어 여성 음성을 높게"},
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for s in SAMPLES:
        path = OUT / f"{s['id']}.mp3"
        await edge_tts.Communicate(s["text"], s["voice"], rate=s["rate"], pitch=s["pitch"]).save(str(path))
        s["audio"] = f"audio/voice-samples/{path.name}"
        print(f"{path.name}  {s['voice']}  rate={s['rate']} pitch={s['pitch']}  ({path.stat().st_size // 1024} KB)")
    (OUT / "samples.json").write_text(json.dumps(SAMPLES, ensure_ascii=False, indent=2), encoding="utf-8")
    # file:// 로 열어도 동작하도록 JS 버전도 함께 저장
    (OUT / "samples.js").write_text("window.TT_VOICE_SAMPLES = " + json.dumps(SAMPLES, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
