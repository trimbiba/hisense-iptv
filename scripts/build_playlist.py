#!/usr/bin/env python3
"""Write playlist.m3u for Kodi (or any IPTV player) from data/channels.json
and config.json.

Channel order: pinned channels first, then each of homeCountries.
Groups in Kodi: "Pinned", one per country, and one per category.
Run after build_data.py: python3 scripts/build_playlist.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
# Built nightly by .github/workflows/update-epg.yml.
GUIDE_URL = "https://raw.githubusercontent.com/trimbiba/hisense-iptv/main/guide.xml.gz"


def main():
    with open(os.path.join(ROOT, "config.json"), encoding="utf-8") as f:
        config = json.load(f)
    with open(os.path.join(ROOT, "data", "channels.json"), encoding="utf-8") as f:
        data = json.load(f)

    hidden = set(config.get("hiddenChannels", []))
    channels = [c for c in data["channels"] if c["i"] not in hidden]
    by_id = {c["i"]: c for c in channels}
    countries = data["countries"]
    categories = data["categories"]

    ordered, seen = [], set()

    def add(ch, first_group):
        if ch["i"] in seen:
            return
        seen.add(ch["i"])
        ordered.append((ch, first_group))

    for cid in config.get("pinnedChannels", []):
        if cid in by_id:
            add(by_id[cid], "Pinned")
    # First the home countries in order (Sweden, then UK, then US…),
    for code in config.get("homeCountries", []):
        for ch in channels:
            if ch["c"] == code:
                add(ch, None)

    # …then every other country, alphabetically by country name, so the
    # playlist holds everything but keeps the priority order at the top.
    rest = sorted(
        {ch["c"] for ch in channels} - set(config.get("homeCountries", [])),
        key=lambda code: countries.get(code, {}).get("n", code or "zz"),
    )
    for code in rest:
        for ch in channels:
            if ch["c"] == code:
                add(ch, None)

    lines = [f'#EXTM3U url-tvg="{GUIDE_URL}"']
    for number, (ch, first_group) in enumerate(ordered, start=1):
        groups = [first_group] if first_group else []
        country = countries.get(ch["c"], {}).get("n")
        if country:
            groups.append(country)
        groups += [categories.get(g, g) for g in ch["g"]]
        name = ch["n"].replace(",", " ")
        attrs = f'tvg-id="{ch["i"]}" tvg-chno="{number}" group-title="{";".join(groups)}"'
        if ch.get("l"):
            attrs += f' tvg-logo="{ch["l"]}"'
        lines.append(f"#EXTINF:-1 {attrs},{name}")
        lines.append(ch["s"][0]["u"])

    with open(os.path.join(ROOT, "playlist.m3u"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Wrote {len(ordered)} channels to playlist.m3u")


if __name__ == "__main__":
    main()
