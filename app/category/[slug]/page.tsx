import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CostCalculator from "@/components/CostCalculator";
import CtaButton from "@/components/CtaButton";
import FeatureTable from "@/components/FeatureTable";
import JsonLd from "@/components/JsonLd";
import { getCategories, getCategory, getPublishedComparisons, getToolsByCategory } from "@/lib/data";
import { dataScore, formatUsd } from "@/lib/insights";
import { YEAR, abs, breadcrumbLd } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return {};
  return {
    title: `Best ${c.short} Software (${YEAR}): Ranked by Features & Price`,
    description: `Compare the best ${c.short.toLowerCase()} tools by price, free plan and features. Includes a cost calculator and head-to-head comparisons.`,
    alternates: { canonical: `/category/${c.slug}` },
  };
}

/** HUB page: links to every spoke (tools, comparisons, alternatives). */
export default async function CategoryHub({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const tools = await getToolsByCategory(slug);
  const comps = (await getPublishedComparisons()).filter((c) => c.category === slug);
  const names = new Map(tools.map((t) => [t.slug, t.name]));
  const ranked = [...tools]
    .map((t) => ({ t, score: dataScore(t, category, tools) }))
    .sort((x, y) => y.score - x.score);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: category.short, path: `/category/${slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: ranked.map(({ t }, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: abs(`/tools/${t.slug}`),
              name: t.name,
            })),
          },
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1>
        Best {category.short} Software in {YEAR}
      </h1>
      <p className="lead">
        {tools.length} {category.short.toLowerCase()} tools ranked by a transparent score: 60% feature coverage, 25%
        price value and 15% free plan availability.
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tool</th>
              <th>Score</th>
              <th>From</th>
              <th>Free plan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ t, score }, i) => (
              <tr key={t.slug}>
                <td>{i + 1}</td>
                <td>
                  <Link href={`/tools/${t.slug}`}>
                    <strong>{t.name}</strong>
                  </Link>
                  <br />
                  <small>{t.best_for.join(", ")}</small>
                </td>
                <td className="score">{score}</td>
                <td>{formatUsd(t.pricing.starting_price_usd)}</td>
                <td>{t.pricing.free_plan ? "✅" : "❌"}</td>
                <td>
                  <CtaButton tool={t} variant="ghost" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Compare costs for your team</h2>
      <CostCalculator
        items={tools.map((t) => ({
          name: t.name,
          slug: t.slug,
          price: t.pricing.starting_price_usd,
          billing: t.pricing.billing,
        }))}
      />

      <h2>Full feature matrix</h2>
      <FeatureTable tools={ranked.map((r) => r.t)} category={category} />

      <h2>Head-to-head comparisons</h2>
      <ul className="links">
        {comps.map((c) => (
          <li key={c.slug}>
            <Link href={`/compare/${c.slug}`}>
              {names.get(c.tool_a)} vs {names.get(c.tool_b)}
            </Link>
          </li>
        ))}
      </ul>

      <h2>Alternatives guides</h2>
      <ul className="links">
        {tools.map((t) => (
          <li key={t.slug}>
            <Link href={`/alternatives/${t.slug}`}>Best {t.name} alternatives</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
