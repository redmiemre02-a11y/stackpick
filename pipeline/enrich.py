"""Step 2: enrich comparisons with AI structured outputs (DeepSeek or Gemini).

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

from pydantic import BaseModel, Field, model_validator

from common import load_env, read, write


class UseCase(BaseModel):
    use_case: str = Field(description="A concrete buyer scenario")
    winner: str = Field(description="Slug of the better tool for this scenario, or 'tie'")
    reason: str = Field(description="One sentence grounded in the provided data")


class Faq(BaseModel):
    question: str
    answer: str


class ComparisonAI(BaseModel):
    summary: str = Field(description="Meta description mentioning both tools")
    verdict: str = Field(description="2-4 sentences. Who should pick which tool and why.")
    winner_overall: str = Field(description="Slug of the overall winner or 'tie'")
    use_cases: list[UseCase]
    pros_a: list[str]
    cons_a: list[str]
    pros_b: list[str]
    cons_b: list[str]
    faq: list[Faq]

    @model_validator(mode="before")
    @classmethod
    def sanitize(cls, data: dict) -> dict:
        if isinstance(data, dict):
            # Limit list lengths to 5 for clean UI display
            if "use_cases" in data and isinstance(data["use_cases"], list):
                data["use_cases"] = data["use_cases"][:5]
            if "faq" in data and isinstance(data["faq"], list):
                data["faq"] = data["faq"][:5]
            if "pros_a" in data and isinstance(data["pros_a"], list):
                data["pros_a"] = data["pros_a"][:5]
            if "cons_a" in data and isinstance(data["cons_a"], list):
                data["cons_a"] = data["cons_a"][:4]
            if "pros_b" in data and isinstance(data["pros_b"], list):
                data["pros_b"] = data["pros_b"][:5]
            if "cons_b" in data and isinstance(data["cons_b"], list):
                data["cons_b"] = data["cons_b"][:4]
            if "summary" in data and isinstance(data["summary"], str) and len(data["summary"]) > 165:
                data["summary"] = data["summary"][:160].rstrip() + "..."
        return data


SYSTEM_PROMPT = """You are a senior software analyst writing a buyer's comparison.
Use ONLY the facts provided. Do not invent prices, integrations, ratings, customer counts, or features.
If something is unknown, do not mention it. Write in clear, specific, neutral English.
Prefer concrete trade-offs (price per seat vs flat price, missing features) over generic marketing phrases.
You MUST output strictly valid JSON."""

PROMPT_TEMPLATE = """Compare {a_name} vs {b_name} in the {category} category.

Tool A slug: {a_slug}
Tool B slug: {b_slug}
Category: {category}
Feature definitions: {features}

FACTS:
{facts}

Return a valid JSON object with the following exact keys:
{{
  "summary": "Short 1-2 sentence meta description mentioning both tools",
  "verdict": "2-4 sentences explaining who should pick which and why (minimum 80 characters)",
  "winner_overall": "{a_slug}" OR "{b_slug}" OR "tie",
  "use_cases": [
    {{"use_case": "buyer scenario", "winner": "{a_slug}"|"{b_slug}"|"tie", "reason": "data-backed reason"}}
  ],
  "pros_a": ["2 to 4 key strengths based on data"],
  "cons_a": ["1 to 3 key limitations based on data"],
  "pros_b": ["2 to 4 key strengths based on data"],
  "cons_b": ["1 to 3 key limitations based on data"],
  "faq": [
    {{"question": "e.g. Is {a_name} cheaper than {b_name}?", "answer": "concise answer"}}
  ]
}}

Ensure 'winner' and 'winner_overall' are strictly "{a_slug}", "{b_slug}", or "tie". Include 3 to 5 use cases and 3 to 5 FAQs.
"""


def validate(ai: ComparisonAI, a: str, b: str) -> list[str]:
    errs = []
    allowed = {a, b, "tie"}
    if ai.winner_overall not in allowed:
        errs.append(f"winner_overall={ai.winner_overall}")
    for u in ai.use_cases:
        if u.winner not in allowed:
            # normalize if it's close or default to tie
            u.winner = "tie"
    if len(ai.verdict) < 40:
        errs.append("verdict too short")
    return errs


def get_ai_caller():
    """Determine whether to use DeepSeek or Gemini based on environment variables."""
    deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if deepseek_key:
        from openai import OpenAI
        model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
        client = OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com")

        def call_deepseek(user_prompt: str) -> ComparisonAI:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            raw = response.choices[0].message.content or "{}"
            return ComparisonAI.model_validate_json(raw)

        return call_deepseek, f"DeepSeek ({model})"

    if gemini_key:
        from google import genai
        model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        client = genai.Client(api_key=gemini_key)

        def call_gemini(user_prompt: str) -> ComparisonAI:
            resp = client.models.generate_content(
                model=model,
                contents=f"{SYSTEM_PROMPT}\n\n{user_prompt}",
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ComparisonAI,
                    "temperature": 0.4,
                },
            )
            return resp.parsed or ComparisonAI.model_validate_json(resp.text)

        return call_gemini, f"Gemini ({model})"

    raise SystemExit("Missing API key. Please set DEEPSEEK_API_KEY or GEMINI_API_KEY in .env")


def main() -> None:
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument("--slug")
    ap.add_argument("--force", action="store_true", help="re-generate even if AI data exists")
    ap.add_argument("--sleep", type=float, default=0.5, help="seconds between calls")
    args = ap.parse_args()

    call_ai, provider_name = get_ai_caller()

    tools = {t["slug"]: t for t in read("tools.json")}
    cats = {c["slug"]: c for c in read("categories.json")}
    comps = read("comparisons.json")

    todo = [c for c in comps if (args.slug is None or c["slug"] == args.slug) and (args.force or not c.get("ai"))]
    todo = todo[: args.limit]
    print(f"Enriching {len(todo)} comparisons using {provider_name}")

    ok = 0
    for c in todo:
        a, b, cat = tools[c["tool_a"]], tools[c["tool_b"]], cats[c["category"]]
        strip = lambda t: {k: v for k, v in t.items() if k not in ("affiliate_url", "last_verified")}
        prompt = PROMPT_TEMPLATE.format(
            a_slug=a["slug"], b_slug=b["slug"], a_name=a["name"], b_name=b["name"],
            category=cat["name"], features=json.dumps(cat["features"]),
            facts=json.dumps({"tool_a": strip(a), "tool_b": strip(b)}, indent=2),
        )
        for attempt in range(3):
            try:
                ai = call_ai(prompt)
                errs = validate(ai, a["slug"], b["slug"])
                if errs:
                    raise ValueError("; ".join(errs))
                c["ai"] = {
                    **ai.model_dump(),
                    "model": provider_name,
                    "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
                ok += 1
                print(f"  [OK] {c['slug']}")
                break
            except Exception as e:  # noqa: BLE001
                print(f"  [ERR] {c['slug']} attempt {attempt + 1}: {e}")
                time.sleep(2 * (attempt + 1))

        write("comparisons.json", comps)  # save progress after each page
        time.sleep(args.sleep)

    print(f"Done: {ok}/{len(todo)} enriched")


if __name__ == "__main__":
    main()
