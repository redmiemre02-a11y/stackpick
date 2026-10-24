"""Step 4: push local JSON to Supabase (upsert via PostgREST).

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.
Usage:  python pipeline/sync_supabase.py
"""
from __future__ import annotations

import os

import requests

from common import load_env, read

TABLES = [("categories", "categories.json"), ("tools", "tools.json"), ("comparisons", "comparisons.json")]


def main() -> None:
    load_env()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    for table, file in TABLES:
        rows = read(file)
        for i in range(0, len(rows), 500):
            chunk = rows[i : i + 500]
            r = requests.post(f"{url}/rest/v1/{table}?on_conflict=slug", json=chunk, headers=headers, timeout=60)
            if r.status_code >= 300:
                raise SystemExit(f"{table}: {r.status_code} {r.text}")
        print(f"  ✓ {table}: {len(rows)} rows")


if __name__ == "__main__":
    main()
