-- StackPick schema. Run in the Supabase SQL editor.

create table if not exists categories (
  slug text primary key,
  name text not null,
  short text not null,
  description text,
  features jsonb not null default '[]'
);

create table if not exists tools (
  slug text primary key,
  name text not null,
  category text not null references categories(slug),
  website text not null,
  affiliate_url text,
  founded int,
  tagline text,
  pricing jsonb not null,      -- {free_plan, starting_price_usd, billing}
  features jsonb not null,     -- {feature_key: bool}
  best_for text[] default '{}',
  last_verified date
);
create index if not exists tools_category_idx on tools(category);

create table if not exists comparisons (
  slug text primary key,       -- "<a>-vs-<b>", alphabetical
  category text not null references categories(slug),
  tool_a text not null references tools(slug),
  tool_b text not null references tools(slug),
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  ai jsonb                     -- Gemini structured output
);
create index if not exists comparisons_status_idx on comparisons(status, published_at desc);
create index if not exists comparisons_category_idx on comparisons(category);

-- Affiliate click log (written by /go/[slug])
create table if not exists clicks (
  id bigint generated always as identity primary key,
  tool_slug text not null,
  referer text,
  has_affiliate boolean,
  created_at timestamptz not null default now()
);

-- Row Level Security: the public (anon) key can only read published content
-- and insert clicks. The pipeline uses the service-role key and bypasses RLS.
alter table categories enable row level security;
alter table tools enable row level security;
alter table comparisons enable row level security;
alter table clicks enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);
drop policy if exists "public read tools" on tools;
create policy "public read tools" on tools for select using (true);
drop policy if exists "public read published comparisons" on comparisons;
create policy "public read published comparisons" on comparisons for select using (status = 'published');
drop policy if exists "public insert clicks" on clicks;
create policy "public insert clicks" on clicks for insert with check (true);

-- Handy view: which tools/pages earn clicks
create or replace view click_stats as
select tool_slug, count(*) as clicks, max(created_at) as last_click
from clicks group by tool_slug order by clicks desc;
