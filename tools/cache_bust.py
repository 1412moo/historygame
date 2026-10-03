"""index.html 의 로컬 CSS/JS 주소에 파일 내용 기준 버전(?v=해시)을 붙인다 (배포 전에 실행).

GitHub Pages 는 모든 파일에 Cache-Control: max-age=600 을 붙여서, 주소가 같으면 휴대폰 브라우저가
배포 후에도 최대 10분 동안 예전 lines.js / js 파일을 쓴다. 파일이 바뀌면 주소도 바뀌게 해서 이를 막는다.

사용법:
    python tools/cache_bust.py
"""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
REF = re.compile(r'((?:src|href)=")((?!https?:|//)[^"?#]+\.(?:js|css))(?:\?v=[0-9a-f]*)?(")')


def file_version(path):
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]


def main():
    html = INDEX.read_bytes().decode("utf-8")  # 줄바꿈(CRLF)을 그대로 유지하려고 바이트로 읽고 쓴다
    changed = []

    def stamp(m):
        f = ROOT / m.group(2)
        if not f.exists():
            return m.group(0)
        changed.append(f"{m.group(2)}?v={file_version(f)}")
        return f"{m.group(1)}{m.group(2)}?v={file_version(f)}{m.group(3)}"

    new = REF.sub(stamp, html)
    if new != html:
        INDEX.write_bytes(new.encode("utf-8"))
    print("index.html 버전: " + ", ".join(changed))


if __name__ == "__main__":
    main()
