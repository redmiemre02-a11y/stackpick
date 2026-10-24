"""Step 3: drip-feed publishing.

Publishes the next N draft comparisons. By default only AI-enriched pages are
eligible (quality gate). Pages are spread across categories round-robin so each
template/category gets impressions early.

Usage:
  python pipeline/publish.py --count 50
  python pipeline/publish.py --count 30 --allow-unenriched   # data-only pages
  python pipeline/publish.py --status                         # show progress
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import datetime, timezone

from common import read, write


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=25)
    ap.add_argument("--allow-unenriched", action="store_true")
    ap.add_argument("--status", action="store_true")
    args = ap.parse_args()

    comps = read("comparisons.json")
    if args.status:
        pub = sum(c["status"] == "published" for c in comps)
        enr = sum(bool(c.get("ai")) for c in comps)
        print(f"published {pub}/{len(comps)} · enriched {enr}/{len(comps)}")
        return

    queues: dict[str, list[dict]] = defaultdict(list)
    for c in comps:
        if c["status"] == "draft" and (args.allow_unenriched or c.get("ai")):
            queues[c["category"]].append(c)

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    published = 0
    while published < args.count and any(queues.values()):
        for cat in list(queues):
            if queues[cat] and published < args.count:
                c = queues[cat].pop(0)
                c["status"] = "published"
                c["published_at"] = now
                published += 1
                print(f"  + {c['slug']}")

    write("comparisons.json", comps)
    remaining = sum(c["status"] == "draft" for c in comps)
    print(f"Published {published}. Drafts remaining: {remaining}")
    if published == 0 and not args.allow_unenriched:
        print("Nothing eligible: run enrich.py first or pass --allow-unenriched")


if __name__ == "__main__":
    main()
