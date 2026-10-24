"""Step 1: generate every A-vs-B pair inside each category.

Existing comparisons keep their status and AI output; new pairs start as drafts.
Usage:  python pipeline/build_pairs.py
"""
from itertools import combinations

from common import pair_slug, read, write


def main() -> None:
    tools = read("tools.json")
    existing = {c["slug"]: c for c in read("comparisons.json")}
    by_cat: dict[str, list[str]] = {}
    for t in tools:
        by_cat.setdefault(t["category"], []).append(t["slug"])

    out, new = [], 0
    for cat, slugs in by_cat.items():
        for a, b in combinations(sorted(slugs), 2):
            slug = pair_slug(a, b)
            if slug in existing:
                out.append(existing[slug])
                continue
            out.append({
                "slug": slug,
                "category": cat,
                "tool_a": a,
                "tool_b": b,
                "status": "draft",
                "published_at": None,
                "ai": None,
            })
            new += 1

    write("comparisons.json", out)
    print(f"{len(out)} comparisons total ({new} new) across {len(by_cat)} categories")


if __name__ == "__main__":
    main()
