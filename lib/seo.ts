import type { Tool } from "./types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tekinemre.com").replace(/\/$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "StackPick";
export const YEAR = new Date().getFullYear();

export function abs(path: string) {
  return `${SITE_URL}${path}`;
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: abs("/icon.png"),
    sameAs: [],
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Data-driven SaaS and software comparisons, pricing calculators, and honest verdicts.",
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function faqLd(faq: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function comparisonArticleLd(a: Tool, b: Tool, summary: string, publishedAt: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${a.name} vs ${b.name} (${YEAR}): Full Comparison, Pricing & Verdict`,
    description: summary,
    datePublished: publishedAt || "2026-01-01T00:00:00Z",
    dateModified: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: [
      {
        "@type": "SoftwareApplication",
        name: a.name,
        applicationCategory: "BusinessApplication",
        offers: a.pricing.starting_price_usd != null ? {
          "@type": "Offer",
          price: a.pricing.starting_price_usd,
          priceCurrency: "USD",
        } : undefined,
      },
      {
        "@type": "SoftwareApplication",
        name: b.name,
        applicationCategory: "BusinessApplication",
        offers: b.pricing.starting_price_usd != null ? {
          "@type": "Offer",
          price: b.pricing.starting_price_usd,
          priceCurrency: "USD",
        } : undefined,
      },
    ],
  };
}
