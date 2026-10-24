import Link from "next/link";
import { getCategories, getPublishedComparisons, getTools } from "@/lib/data";
import { YEAR } from "@/lib/seo";

export const revalidate = 3600;

export default async function Home() {
  const [categories, tools, comparisons] = await Promise.all([
    getCategories(),
    getTools(),
    getPublishedComparisons(),
  ]);
  const byName = new Map(tools.map((t) => [t.slug, t.name]));

  return (
    <>
      <h1>Pick the right software, backed by data</h1>
      <p className="lead">
        {comparisons.length} head-to-head comparisons across {tools.length} tools. Every page is generated from
        structured pricing and feature data, so you see real differences up front.
      </p>

      <h2>Browse by category</h2>
      <div className="grid">
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="card">
            <strong>
              Best {c.short} Software ({YEAR})
            </strong>
            <p className="muted">{c.description}</p>
          </Link>
        ))}
      </div>

      <h2>Latest comparisons</h2>
      <ul className="links">
        {comparisons.slice(0, 20).map((c) => (
          <li key={c.slug}>
            <Link href={`/compare/${c.slug}`}>
              {byName.get(c.tool_a)} vs {byName.get(c.tool_b)}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
