import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CostCalculator from "@/components/CostCalculator";
import CtaButton from "@/components/CtaButton";
import FeatureTable from "@/components/FeatureTable";
import JsonLd from "@/components/JsonLd";
import ToolLogo from "@/components/ToolLogo";
import {
  getCategory,
  getComparison,
  getPublishedComparisons,
  getRelatedComparisons,
  getTool,
  getTools,
  pairSlug,
} from "@/lib/data";
import { featureCoverage, formatUsd, quickFacts } from "@/lib/insights";
import { YEAR, breadcrumbLd, faqLd, comparisonArticleLd } from "@/lib/seo";

export const revalidate = 86400; // ISR: refresh once per day
export const dynamicParams = true; // pages not prebuilt are rendered on first request

const PREBUILD_LIMIT = 500; // keeps build time flat no matter how many pages exist

type Props = { params: Promise<{ pair: string }> };

export async function generateStaticParams() {
  const all = await getPublishedComparisons();
  return all.slice(0, PREBUILD_LIMIT).map((c) => ({ pair: c.slug }));
}

async function load(pair: string) {
  const comp = await getComparison(pair);
  if (!comp) return null;
  const [a, b, category] = await Promise.all([getTool(comp.tool_a), getTool(comp.tool_b), getCategory(comp.category)]);
  if (!a || !b || !category) return null;
  return { comp, a, b, category };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const d = await load(pair);
  if (!d) return {};
  const { a, b, comp } = d;
  const title = `${a.name} vs ${b.name} (${YEAR}): Pricing, Features & Verdict`;
  const description =
    comp.ai?.summary.slice(0, 155) ??
    `${a.name} vs ${b.name}: compare pricing, free plans and features side by side, and see which one fits your team.`;
  return {
    title,
    description,
    alternates: { canonical: `/compare/${comp.slug}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ComparePage({ params }: Props) {
  const { pair } = await params;

  // Canonicalise reversed URLs (b-vs-a → a-vs-b) to avoid duplicate content.
  const m = pair.match(/^(.+)-vs-(.+)$/);
  if (m && pairSlug(m[1], m[2]) !== pair) permanentRedirect(`/compare/${pairSlug(m[1], m[2])}`);

  const d = await load(pair);
  if (!d) notFound();
  const { comp, a, b, category } = d;
  const ai = comp.ai;
  const facts = quickFacts(a, b, category);
  const related = await getRelatedComparisons(comp, 6);
  const names = new Map((await getTools()).map((t) => [t.slug, t.name]));
  const winnerName = (s: string) => (s === "tie" ? "Tie" : names.get(s) ?? s);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: category.short, path: `/category/${category.slug}` },
    { name: `${a.name} vs ${b.name}`, path: `/compare/${comp.slug}` },
  ];

  return (
    <article>
      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          comparisonArticleLd(a, b, ai?.summary || facts.join(" "), comp.published_at),
          ...(ai?.faq?.length ? [faqLd(ai.faq)] : []),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1>
        {a.name} vs {b.name}: Which {category.short} Tool Is Better in {YEAR}?
      </h1>

      {/* Visual VS Hero Banner */}
      <div className="vs-hero">
        <div className="vs-tool">
          <ToolLogo tool={a} size={56} />
          <h2>{a.name}</h2>
          <span className="price-tag">From {formatUsd(a.pricing.starting_price_usd)}</span>
        </div>
        <div className="vs-badge">VS</div>
        <div className="vs-tool">
          <ToolLogo tool={b} size={56} />
          <h2>{b.name}</h2>
          <span className="price-tag">From {formatUsd(b.pricing.starting_price_usd)}</span>
        </div>
      </div>

      {/* 1) Answer first: verdict box above the fold */}
      <section className="verdict">
        <h2>Quick verdict</h2>
        {ai ? (
          <>
            <p>
              <span className="badge">Overall pick: {winnerName(ai.winner_overall)}</span>
            </p>
            <p>{ai.verdict}</p>
          </>
        ) : null}
        <ul className="facts">
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <CtaButton tool={a} />
        <CtaButton tool={b} variant="ghost" />
      </section>

      {/* 2) Micro-tool */}
      <CostCalculator
        items={[a, b].map((t) => ({
          name: t.name,
          slug: t.slug,
          price: t.pricing.starting_price_usd,
          billing: t.pricing.billing,
        }))}
      />

      {/* 3) Use-case winners */}
      {ai?.use_cases?.length ? (
        <>
          <h2>Which one should you choose?</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>If you need…</th>
                  <th>Pick</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody>
                {ai.use_cases.map((u) => (
                  <tr key={u.use_case}>
                    <td>{u.use_case}</td>
                    <td>
                      <strong>{winnerName(u.winner)}</strong>
                    </td>
                    <td>{u.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* 4) Spec table */}
      <h2>
        Feature comparison: {a.name} vs {b.name}
      </h2>
      <FeatureTable tools={[a, b]} category={category} />

      {/* 5) Pros & cons */}
      {ai ? (
        <>
          <h2>Pros and cons</h2>
          <div className="grid-2">
            {[
              { t: a, pros: ai.pros_a, cons: ai.cons_a },
              { t: b, pros: ai.pros_b, cons: ai.cons_b },
            ].map(({ t, pros, cons }) => (
              <div className="card" key={t.slug}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <ToolLogo tool={t} size={32} />
                  <h3 style={{ margin: 0 }}>{t.name}</h3>
                </div>
                <ul className="pros">
                  {pros.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <ul className="cons">
                  {cons.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <CtaButton tool={t} variant="ghost" />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* 6) At a glance */}
      <h2>At a glance</h2>
      <div className="grid-2">
        {[a, b].map((t) => {
          const cov = featureCoverage(t, category);
          return (
            <div className="card" key={t.slug}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <ToolLogo tool={t} size={32} />
                <h3 style={{ margin: 0 }}>
                  <Link href={`/tools/${t.slug}`}>{t.name}</Link>
                </h3>
              </div>
              <p>{t.tagline}</p>
              <p className="muted">
                Founded {t.founded ?? "n/a"} · From {formatUsd(t.pricing.starting_price_usd)} · {cov.have}/{cov.total}{" "}
                tracked features
              </p>
              <p>Best for: {t.best_for.join(", ")}</p>
              <Link href={`/alternatives/${t.slug}`}>See {t.name} alternatives →</Link>
            </div>
          );
        })}
      </div>

      {/* 7) FAQ */}
      {ai?.faq?.length ? (
        <section className="faq">
          <h2>FAQ</h2>
          {ai.faq.map((f) => (
            <details key={f.question}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </section>
      ) : null}

      {/* 8) Hub & spoke internal links */}
      {related.length > 0 && (
        <>
          <h2>Related comparisons</h2>
          <ul className="links">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/compare/${r.slug}`}>
                  {names.get(r.tool_a)} vs {names.get(r.tool_b)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="muted">
        Data last reviewed: {a.last_verified ?? "pending verification"}. <Link href={`/category/${category.slug}`}>All {category.short} tools →</Link>
      </p>
    </article>
  );
}
