#!/usr/bin/env python3
"""Inject iOS Add-to-Home-Screen / PWA tags into exported game HTML files.

Run after exporting artifacts into public/games/, before committing:
    python3 scripts/add-pwa-tags.py

Idempotent: skips files that already carry the tags.
The landing page (index.html) is maintained by hand, not by this script.
"""
import re
from pathlib import Path

GAMES_DIR = Path(__file__).resolve().parent.parent / "public" / "games"

# file stem -> (home-screen title, theme color)
GAMES = {
    "bubble-pop": ("Bubbles", "#2563eb"),
    "finger-paint": ("Paint", "#e11d48"),
    "peekaboo-animals": ("Animals", "#16a34a"),
    "music-pads": ("Music", "#f97316"),
    "particle-galaxy": ("Galaxy", "#6d28d9"),
    "fluid-simulation": ("Fluid", "#0e7490"),
    "sand-crumble": ("Sand", "#b45309"),
    "stacking-blocks": ("Blocks", "#dc2626"),
}

MARKER = "pwa-tags"
TAGS_TEMPLATE = """<meta name="{m}" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{title}">
<meta name="theme-color" content="{color}">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="manifest" href="manifest.json">"""


def main() -> None:
    for stem, (title, color) in GAMES.items():
        path = GAMES_DIR / f"{stem}.html"
        if not path.exists():
            print(f"skip {stem}: not exported yet")
            continue
        html = path.read_text()
        if MARKER in html:
            print(f"skip {stem}: tags already present")
            continue
        tags = "<!-- " + MARKER + " -->\n" + TAGS_TEMPLATE.format(
            m=MARKER, title=title, color=color
        )
        html2, n = re.subn(r"<head[^>]*>", lambda m: m.group(0) + "\n" + tags, html, count=1)
        if n == 0:  # no <head>: prepend
            html2 = tags + "\n" + html
        path.write_text(html2)
        print(f"injected {stem}")


if __name__ == "__main__":
    main()
