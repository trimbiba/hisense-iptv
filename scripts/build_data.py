#!/usr/bin/env python3
"""Download the iptv-org API and write a compact data/channels.json for the TV app.

The full API is ~18 MB; TV browsers struggle with that, so we keep only
channels that have a playable stream and only the fields the app uses.
Run: python3 scripts/build_data.py
"""
import json
import os
import urllib.request
from datetime import datetime, timezone

API = "https://iptv-org.github.io/api/"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "channels.json")


def fetch(name):
    with urllib.request.urlopen(API + name + ".json", timeout=120) as r:
        return json.load(r)


def main():
    channels = fetch("channels")
    streams = fetch("streams")
    logos = fetch("logos")
    countries = fetch("countries")
    categories = fetch("categories")

    # Streams that need a custom User-Agent or Referrer can't be played from a
    # browser, so skip them.
    by_channel = {}
    for s in streams:
        if not s.get("channel") or s.get("user_agent") or s.get("referrer"):
            continue
        entry = {"u": s["url"]}
        if s.get("quality"):
            entry["q"] = s["quality"]
        by_channel.setdefault(s["channel"], []).append(entry)

    # Prefer https streams first, then higher quality.
    def rank(st):
        q = st.get("q", "")
        num = int("".join(ch for ch in q if ch.isdigit()) or 0)
        return (not st["u"].startswith("https"), -num)

    logo_for = {}
    for l in logos:
        if l.get("feed") is None and l.get("in_use", True) and l["channel"] not in logo_for:
            logo_for[l["channel"]] = l["url"]

    out_channels = []
    used_countries = set()
    for c in channels:
        if c.get("is_nsfw") or c.get("closed") or c["id"] not in by_channel:
            continue
        item = {
            "i": c["id"],
            "n": c["name"],
            "c": c.get("country"),
            "g": c.get("categories") or [],
            "s": sorted(by_channel[c["id"]], key=rank),
        }
        if c["id"] in logo_for:
            item["l"] = logo_for[c["id"]]
        out_channels.append(item)
        used_countries.add(c.get("country"))

    out_channels.sort(key=lambda x: x["n"].lower())
    data = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "countries": {
            c["code"]: {"n": c["name"], "f": c.get("flag", "")}
            for c in countries
            if c["code"] in used_countries
        },
        "categories": {c["id"]: c["name"] for c in categories},
        "channels": out_channels,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Wrote {len(out_channels)} channels to {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
