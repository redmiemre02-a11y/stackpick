import Link from "next/link";
import CompareSelector from "@/components/CompareSelector";
import ToolLogo from "@/components/ToolLogo";
import { getCategories, getPublishedComparisons, getTools } from "@/lib/data";
import { YEAR } from "@/lib/seo";

export const revalidate = 3600;

export default async function Home() {
  const [categories, tools, comparisons] = await Promise.all([
    getCategories(),
    getTools(),
    getPublishedComparisons(),
  ]);

  const toolMap = new Map(tools.map((t) => [t.slug, t]));

  // Featured comparisons for the homepage (preferring those with AI enrichment)
  const featured = comparisons.slice(0, 6);

  return (
    <>
      {/* 1. Hero Section with Interactive Selector */}
      <section className="home-hero">
        <span className="badge" style={{ marginBottom: 12 }}>
          ⚡ {comparisons.length}+ In-Depth SaaS Comparisons for {YEAR}
        </span>
        <h1>
          Find the Right Software, <br />
          <span className="highlight">Backed by Honest Data</span>
        </h1>
        <p>
          Skip the bias and paid rankings. We analyze real pricing models, feature matrices,
          and hidden limits so your team picks the perfect tool.
        </p>

        {/* Interactive Compare Tool Selector */}
        <CompareSelector tools={tools} />
      </section>

      {/* 2. Value Props / Why StackPick */}
      <section className="trust-grid">
        <div className="trust-item">
          <span style={{ fontSize: "1.75rem" }}>📊</span>
          <h4>Structured Fact Matrix</h4>
          <p>
            No fluffy marketing copy. We evaluate tools across 8+ core features and verified pricing structures.
          </p>
        </div>
        <div className="trust-item">
          <span style={{ fontSize: "1.75rem" }}>🧮</span>
          <h4>Live Team Cost Calculator</h4>
          <p>
            Per-seat vs flat rates get confusing fast. Slide your team size to see your real monthly &amp; annual bill.
          </p>
        </div>
        <div className="trust-item">
          <span style={{ fontSize: "1.75rem" }}>🤖</span>
          <h4>AI-Powered Synthesis</h4>
          <p>
            Our DeepSeek intelligence engine evaluates real-world buyer scenarios to declare clear use-case winners.
          </p>
        </div>
      </section>

      {/* 3. Browse Software by Category */}
      <section style={{ marginTop: 40 }}>
        <h2>Explore Software Categories</h2>
        <p className="lead">
          Browse verified tools and side-by-side rankings across popular software categories.
        </p>

        <div className="grid">
          {categories.map((c) => {
            const catTools = tools.filter((t) => t.category === c.slug);
            const catComps = comparisons.filter((cmp) => cmp.category === c.slug);
            return (
              <Link key={c.slug} href={`/category/${c.slug}`} className="cat-card">
                <div>
                  <h3>{c.short}</h3>
                  <p>{c.description}</p>
                </div>
                <div>
                  <div className="logo-stack">
                    {catTools.slice(0, 5).map((t) => (
                      <div key={t.slug} className="logo-stack-item">
                        <ToolLogo tool={t} size={28} />
                      </div>
                    ))}
                    {catTools.length > 5 && (
                      <span className="muted" style={{ marginLeft: 8, fontSize: "0.8rem", fontWeight: 600 }}>
                        +{catTools.length - 5}
                      </span>
                    )}
                  </div>
                  <span className="muted" style={{ fontSize: "0.85rem" }}>
                    {catTools.length} tools · {catComps.length} comparisons →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Featured Head-to-Head Comparisons */}
      {featured.length > 0 && (
        <section style={{ marginTop: 50 }}>
          <h2>Trending Comparisons</h2>
          <p className="lead">Direct head-to-head battles our readers are checking right now.</p>

          <div className="grid-2">
            {featured.map((c) => {
              const a = toolMap.get(c.tool_a);
              const b = toolMap.get(c.tool_b);
              if (!a || !b) return null;
              return (
                <Link key={c.slug} href={`/compare/${c.slug}`} className="comp-card">
                  <div>
                    <div className="comp-card-logos">
                      <ToolLogo tool={a} size={36} />
                      <span className="comp-card-vs">VS</span>
                      <ToolLogo tool={b} size={36} />
                    </div>
                    <strong style={{ fontSize: "1.1rem" }}>
                      {a.name} vs {b.name}
                    </strong>
                    <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.875rem" }}>
                      {c.ai?.summary || `${a.name} and ${b.name} feature comparison, pricing models and verdict.`}
                    </p>
                  </div>
                  <span style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", marginTop: 14 }}>
                    Read full comparison →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Complete Index Directory (SEO Hub & Spoke) */}
      <section style={{ marginTop: 60, borderTop: "1px solid var(--border)", paddingTop: 30 }}>
        <h2>All Popular Comparisons</h2>
        <ul className="links">
          {comparisons.map((c) => {
            const a = toolMap.get(c.tool_a);
            const b = toolMap.get(c.tool_b);
            if (!a || !b) return null;
            return (
              <li key={c.slug}>
                <Link href={`/compare/${c.slug}`}>
                  {a.name} vs {b.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
