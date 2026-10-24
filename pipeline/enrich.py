"""Step 2: enrich comparisons with Gemini structured outputs.

The model only receives the structured facts we hold and must return JSON
matching the ComparisonAI schema. Outputs that fail validation are rejected.

Usage:
  python pipeline/enrich.py --limit 20            # enrich 20 drafts without AI data
  python pipeline/enrich.py --slug asana-vs-trello --force
"""
from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

from common import load_env, read, write


class UseCase(BaseModel):
    use_case: str = Field(description="A concrete buyer scenario, e.g. 'Teams of 20+ on a tight budget'")
    winner: str = Field(description="Slug of the better tool for this scenario, or 'tie'")
    reason: str = Field(description="One sentence grounded in the provided data")


class Faq(BaseModel):
    question: str
    answer: str


class ComparisonAI(BaseModel):
    summary: str = Field(description="<=155 characters, meta-description style, mentions both tools")
    verdict: str = Field(description="2-4 sentences. Who should pick which tool and why.")
    winner_overall: str = Field(description="Slug of the overall winner or 'tie'")
    use_cases: list[UseCase] = Field(min_length=3, max_length=5)
    pros_a: list[str] = Field(min_length=2, max_length=5)
    cons_a: list[str] = Field(min_length=1, max_length=4)
    pros_b: list[str] = Field(min_length=2, max_length=5)
    cons_b: list[str] = Field(min_length=1, max_length=4)
    faq: list[Faq] = Field(min_length=3, max_length=5)


PROMPT = """You are a senior software analyst writing a buyer's comparison.
Use ONLY the facts in the JSON below. Do not invent prices, integrations,
ratings, customer counts or features that are not listed. If something is
unknown, do not mention it. Write in clear, specific, neutral English.
Prefer concrete trade-offs (price per seat vs flat price, missing features)
over generic marketing phrases.

Tool A slug: {a_slug}
Tool B slug: {b_slug}
Category: {category}
Feature definitions: {features}

FACTS:
{facts}

Return JSON for the comparison. 'winner' and 'winner_overall' must be
exactly "{a_slug}", "{b_slug}" or "tie". FAQ questions should be the
questions real buyers type into Google (e.g. "Is {a_name} cheaper than {b_name}?").
"""


def validate(ai: ComparisonAI, a: str, b: str) -> list[str]:
    errs = []
    allowed = {a, b, "tie"}
    if ai.winner_overall not in allowed:
        errs.append(f"winner_overall={ai.winner_overall}")
    errs += [f"use_case winner={u.winner}" for u in ai.use_cases if u.winner not in allowed]
    if len(ai.verdict) < 80:
        errs.append("verdict too short")
    return errs


def main() -> None:
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument("--slug")
    ap.add_argument("--force", action="store_true", help="re-generate even if AI data exists")
    ap.add_argument("--sleep", type=float, default=1.0, help="seconds between calls (rate limiting)")
    args = ap.parse_args()

    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise SystemExit("GEMINI_API_KEY missing (set it in .env)")
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    from google import genai  # imported lazily so other scripts work without it

    client = genai.Client(api_key=key)
    tools = {t["slug"]: t for t in read("tools.json")}
    cats = {c["slug"]: c for c in read("categories.json")}
    comps = read("comparisons.json")

    todo = [c for c in comps if (args.slug is None or c["slug"] == args.slug) and (args.force or not c.get("ai"))]
    todo = todo[: args.limit]
    print(f"Enriching {len(todo)} comparisons with {model}")

    ok = 0
    for c in todo:
        a, b, cat = tools[c["tool_a"]], tools[c["tool_b"]], cats[c["category"]]
        strip = lambda t: {k: v for k, v in t.items() if k not in ("affiliate_url", "last_verified")}
        prompt = PROMPT.format(
            a_slug=a["slug"], b_slug=b["slug"], a_name=a["name"], b_name=b["name"],
            category=cat["name"], features=json.dumps(cat["features"]),
            facts=json.dumps({"tool_a": strip(a), "tool_b": strip(b)}, indent=2),
        )
        for attempt in range(3):
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": ComparisonAI,
                        "temperature": 0.4,
                    },
                )
                ai: ComparisonAI = resp.parsed or ComparisonAI.model_validate_json(resp.text)
                errs = validate(ai, a["slug"], b["slug"])
                if errs:
                    raise ValueError("; ".join(errs))
                c["ai"] = {
                    **ai.model_dump(),
                    "model": model,
                    "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
                ok += 1
                print(f"  ✓ {c['slug']}")
                break
            except Exception as e:  # noqa: BLE001
                print(f"  ! {c['slug']} attempt {attempt + 1}: {e}")
                time.sleep(2 * (attempt + 1))
        write("comparisons.json", comps)  # save progress after every item
        time.sleep(args.sleep)

    print(f"Done: {ok}/{len(todo)} enriched")


if __name__ == "__main__":
    main()
