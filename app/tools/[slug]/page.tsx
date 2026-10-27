import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButton from "@/components/CtaButton";
import JsonLd from "@/components/JsonLd";
import ToolLogo from "@/components/ToolLogo";
import { getCategory, getComparisonsForTool, getTool, getTools } from "@/lib/data";
import { featureCoverage, formatUsd } from "@/lib/insights";
import { YEAR, abs, breadcrumbLd } from "@/lib/seo";

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
    title: `${t.name} Review (${YEAR}): Pricing, Features, Pros & Cons`,
    description: `${t.name}: ${t.tagline} Pricing from ${formatUsd(t.pricing.starting_price_usd)}, free plan: ${t.pricing.free_plan ? "yes" : "no"}.`,
    alternates: { canonical: `/tools/${t.slug}` },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) notFound();
  const category = await getCategory(tool.category);
  if (!category) notFound();
  const comps = await getComparisonsForTool(slug);
  const names = new Map((await getTools()).map((t) => [t.slug, t.name]));
  const cov = featureCoverage(tool, category);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: category.short, path: `/category/${category.slug}` },
    { name: tool.name, path: `/tools/${tool.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: tool.name,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: abs(`/tools/${tool.slug}`),
            ...(tool.pricing.starting_price_usd != null && {
              offers: { "@type": "Offer", price: tool.pricing.starting_price_usd, priceCurrency: "USD" },
            }),
          },
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, marginBottom: 8 }}>
        <ToolLogo tool={tool} size={52} />
        <h1 style={{ margin: 0 }}>
          {tool.name} Review: Pricing &amp; Features ({YEAR})
        </h1>
      </div>
      <p className="lead">{tool.tagline}</p>
      <CtaButton tool={tool} />

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Pricing</h3>
          <p>
            From <strong>{formatUsd(tool.pricing.starting_price_usd)}</strong>
            {tool.pricing.billing === "per_seat" ? " per user / month" : " / month"}
          </p>
          <p>Free plan: {tool.pricing.free_plan ? "Yes" : "No"}</p>
          <p>Founded: {tool.founded ?? "n/a"}</p>
        </div>
        <div className="card">
          <h3>
            Features ({cov.have}/{cov.total})
          </h3>
          <ul>
            {category.features.map((f) => (
              <li key={f.key}>
                {tool.features[f.key] ? "✅" : "—"} {f.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h2>{tool.name} compared</h2>
      <ul className="links">
        {comps.map((c) => {
          const other = c.tool_a === slug ? c.tool_b : c.tool_a;
          return (
            <li key={c.slug}>
              <Link href={`/compare/${c.slug}`}>
                {tool.name} vs {names.get(other)}
              </Link>
            </li>
          );
        })}
      </ul>
      <p>
        <Link href={`/alternatives/${tool.slug}`}>Best {tool.name} alternatives →</Link>
      </p>
    </>
  );
}
