import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButton from "@/components/CtaButton";
import JsonLd from "@/components/JsonLd";
import { getCategory, getPublishedComparisons, getTool, getTools, getToolsByCategory, pairSlug } from "@/lib/data";
import { featureDiff, formatUsd, similarity } from "@/lib/insights";
import { YEAR, breadcrumbLd } from "@/lib/seo";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getTools()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTool(slug);
  if (!t) return {};
  return {
    title: `Best ${t.name} Alternatives (${YEAR}): Cheaper & Free Options`,
    description: `Looking for a ${t.name} alternative? See the closest matches ranked by feature overlap and price, including free options.`,
    alternates: { canonical: `/alternatives/${t.slug}` },
  };
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) notFound();
  const category = await getCategory(tool.category);
  if (!category) notFound();
  const peers = (await getToolsByCategory(tool.category)).filter((t) => t.slug !== slug);
  const published = new Set((await getPublishedComparisons()).map((c) => c.slug));
  const ranked = peers
    .map((p) => ({ p, sim: similarity(tool, p, category), diff: featureDiff(tool, p, category) }))
    .sort((x, y) => y.sim - x.sim);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: category.short, path: `/category/${category.slug}` },
    { name: `${tool.name} alternatives`, path: `/alternatives/${slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <h1>
        {ranked.length} Best {tool.name} Alternatives in {YEAR}
      </h1>
      <p className="lead">
        Ranked by how closely each tool matches {tool.name}&apos;s feature set and price (from{" "}
        {formatUsd(tool.pricing.starting_price_usd)}).
      </p>

      {ranked.map(({ p, sim, diff }, i) => {
        const cs = pairSlug(slug, p.slug);
        const cheaper =
          p.pricing.starting_price_usd != null &&
          tool.pricing.starting_price_usd != null &&
          p.pricing.starting_price_usd < tool.pricing.starting_price_usd;
        return (
          <section className="card" key={p.slug} style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>
              {i + 1}. {p.name} <span className="badge">{Math.round(sim * 100)}% match</span>
            </h2>
            <p>{p.tagline}</p>
            <p className="muted">
              From {formatUsd(p.pricing.starting_price_usd)}
              {cheaper ? " (cheaper)" : ""} · Free plan: {p.pricing.free_plan ? "yes" : "no"} · Best for{" "}
              {p.best_for.join(", ")}
            </p>
            {diff.onlyB.length > 0 && (
              <p>
                <strong>Has that {tool.name} lacks:</strong> {diff.onlyB.map((f) => f.label).join(", ")}
              </p>
            )}
            {diff.onlyA.length > 0 && (
              <p>
                <strong>Missing vs {tool.name}:</strong> {diff.onlyA.map((f) => f.label).join(", ")}
              </p>
            )}
            <CtaButton tool={p} />
            {published.has(cs) && (
              <Link className="btn ghost" href={`/compare/${cs}`}>
                {tool.name} vs {p.name}
              </Link>
            )}
          </section>
        );
      })}
      <p>
        <Link href={`/tools/${slug}`}>← {tool.name} review</Link> ·{" "}
        <Link href={`/category/${category.slug}`}>All {category.short} tools</Link>
      </p>
    </>
  );
}
