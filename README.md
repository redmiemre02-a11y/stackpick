# StackPick: Programmatic SEO engine for SaaS comparisons

Next.js 16 (ISR) + Supabase + a Python/Gemini pipeline. It generates
`A vs B`, `Alternatives`, tool review and category hub pages from structured data.

## Quick start (local, no keys needed)

```bash
npm install
pip install -r pipeline/requirements.txt
python pipeline/build_pairs.py                         # all A-vs-B pairs → data/comparisons.json
python pipeline/publish.py --count 30 --allow-unenriched
npm run build && npm start                             # http://localhost:3000
```

## Daily workflow (the money machine)

```bash
python pipeline/build_pairs.py          # after adding tools to data/tools.json
python pipeline/enrich.py --limit 50    # Gemini structured output (needs GEMINI_API_KEY)
python pipeline/publish.py --count 50   # drip-feed: only enriched pages pass the gate
python pipeline/sync_supabase.py        # push to production DB (ISR picks it up within 24h)
```

Automate it with a daily GitHub Action or cron job.

## Page types

| Route | Intent | Monetisation |
|---|---|---|
| `/compare/[a]-vs-[b]` | High purchase intent | Affiliate CTA ×4, cost calculator |
| `/alternatives/[tool]` | Switching intent | Affiliate CTA per alternative |
| `/category/[slug]` | "best X software" hub | Ranked table + CTAs, links to every spoke |
| `/tools/[slug]` | Review / brand intent | Affiliate CTA |
| `/go/[slug]` | Affiliate redirect | Logs clicks to Supabase `clicks` |

## Before going live (important)

1. **Verify the seed data.** The prices and features in `data/tools.json` are a starting point only. Check each vendor's pricing page and set `last_verified`.
2. Add your affiliate links to `affiliate_url` (PartnerStack, Impact, or the vendor's own programme).
3. Create a Supabase project, run `supabase/schema.sql`, fill in `.env` (see `.env.example`) and set the same env vars on Vercel.
4. Submit `/sitemap.xml` in Google Search Console.
