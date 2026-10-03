# ⏳ 시간여행자 — 세종대왕과 훈민정음의 비밀

어린이용 역사 탐험 게임 프로토타입. 설치 없이 브라우저에서 바로 실행되는 순수 HTML/CSS/JavaScript 게임입니다. 그래픽과 효과음은 모두 코드로 직접 그리고 합성했습니다.

## 실행

```bash
python -m http.server 8123
```
→ http://localhost:8123

또는 `index.html` 을 더블클릭해도 실행됩니다.

GitHub Pages: 이 폴더를 그대로 올리고 Pages를 켜면 됩니다. 빌드 단계는 없습니다.
JS·CSS를 고친 뒤에는 커밋 전에 `python tools/cache_bust.py` 를 실행하세요. `index.html` 의 `?v=` 버전이 갱신되어,
휴대폰이 Pages 캐시(10분)에 남은 예전 파일을 쓰지 않습니다. 음성을 다시 만들 때는 `typecast_game_voice.py` 가 자동으로 실행합니다.

## 조작
- 이동: 방향키 / WASD (Shift: 달리기)
- 말걸기·조사·다음: 스페이스 / 엔터 / E
- 도감: B · 지도: M
- 휴대폰: 화면의 방향 버튼 + A 버튼

## 구조
| 파일 | 내용 |
|---|---|
| `js/game.js` | 게임 루프, 입력, 이동·충돌, 카메라, 렌더링, 저장(localStorage) |
| `js/maps.js` | 한양 맵 + 실내 맵(궁궐·집현전·작업장) |
| `js/story.js` | NPC, 대사, 미션 단계, 도감 데이터 ← **콘텐츠 확장은 주로 여기** |
| `js/minigames.js` | 한글 조합 퍼즐, 퀴즈, 자격루 조립 |
| `js/art.js` | 타일·건물·캐릭터 그리기 |
| `js/ui.js` | 대화창, 보상, 도감, 지도, 설정 |

## 음성
- 대사 음성: [Typecast](https://typecast.ai) 로 개발 중에 미리 만든 MP3 (`audio/voice/`). 게임 실행 중에는 TTS API를 부르지 않고, API 키도 배포물에 없습니다.
- 다시 만들기: `TYPECAST_API_KEY` 환경 변수를 설정하고 `python tools/typecast_game_voice.py generate` (없는 파일만 생성).
- 녹음이 없는 대사는 브라우저 읽어주기(Web Speech)로 읽습니다.
- `audio/voice-samples/` 는 음성 비교용 개발 샘플입니다 (`?dev` 의 🎧 패널). 일부는 ElevenLabs 로 만들었습니다.

저장 데이터 초기화: 게임 안의 ⚙️ 설정 → "처음부터 다시 하기".
