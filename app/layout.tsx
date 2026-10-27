import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import JsonLd from "@/components/JsonLd";
import { getCategories } from "@/lib/data";
import { SITE_NAME, SITE_URL, organizationLd, websiteLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: Data-Driven SaaS & Software Comparisons`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Make the right software decision backed by honest facts. Head-to-head SaaS comparisons, pricing calculators, and verified feature differences.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME}: Data-Driven SaaS Comparisons`,
    description:
      "Head-to-head software comparisons, feature breakdowns, and team cost calculators.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}: Data-Driven SaaS Comparisons`,
    description:
      "Head-to-head software comparisons, feature breakdowns, and team cost calculators.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "TjJGKzFkd-lshzAMXP1kFT1TIbRhXhwoEi4EpXav0nE",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <html lang="en">
      <head>
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </head>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              <span style={{ fontSize: "1.4rem" }}>⚡</span> {SITE_NAME}
            </Link>
            <nav>
              {categories.map((c) => (
                <Link key={c.slug} href={`/category/${c.slug}`}>
                  {c.short}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="site-footer">
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
              <div>
                <strong>{SITE_NAME}</strong>
                <p className="muted" style={{ margin: "4px 0 0", maxWidth: 400 }}>
                  Independent, data-driven software directory comparing features, pricing models, and team tiers.
                </p>
              </div>
              <div>
                <strong>Categories</strong>
                <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", fontSize: "0.9rem" }}>
                  {categories.map((c) => (
                    <li key={c.slug} style={{ marginBottom: 4 }}>
                      <Link href={`/category/${c.slug}`}>{c.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <strong>Affiliate disclosure:</strong> Some links on this site are affiliate links. If you purchase through them,
              we may earn an affiliate commission at no additional cost to you. Ratings and comparisons are generated strictly from
              objective, structured pricing and feature matrices.
            </p>
            <p className="muted" style={{ fontSize: "0.8rem", margin: "6px 0 0" }}>
              © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
