"""One-shot script: pull the 3 base64 data URLs out of the original HTML
and write them as real files into /public. Safe to delete after running."""
import base64
import re
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "Anu & Susan · Wedding Invitation.html"
OUT = Path(__file__).resolve().parent / "public"
OUT.mkdir(parents=True, exist_ok=True)

html = SRC.read_text(encoding="utf-8")

# Match any <img ...> tag with a data: URL, capturing the class (if any) and payload.
pattern = re.compile(
    r'<img([^>]*?)src="data:image/(jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)"',
    re.IGNORECASE,
)

targets = {
    "card": "invitation.jpg",
    "jh l": "jhalar-l.png",
    "jh r": "jhalar-r.png",
}

# Fallback: in case the main invitation <img> has no explicit class, treat the
# first JPEG match as the card.
first_jpeg_used = False

for m in pattern.finditer(html):
    attrs, ext, payload = m.group(1), m.group(2).lower(), m.group(3)
    cls_match = re.search(r'class="([^"]+)"', attrs)
    cls = cls_match.group(1).strip() if cls_match else ""

    name = None
    for key, fname in targets.items():
        if key in cls:
            name = fname
            break

    if name is None and ext in ("jpeg", "jpg") and not first_jpeg_used:
        name = targets["card"]
        first_jpeg_used = True

    if name is None:
        # Not a known image — skip
        continue

    data = base64.b64decode(payload)
    (OUT / name).write_bytes(data)
    print(f"wrote {name}: {len(data):,} bytes")
