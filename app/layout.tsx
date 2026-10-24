import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCategories } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: Data-driven SaaS comparisons`, template: `%s | ${SITE_NAME}` },
  description: "Side-by-side SaaS comparisons built on structured pricing and feature data.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              {SITE_NAME}
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
            <p>
              <strong>Affiliate disclosure:</strong> Some links on this site are affiliate links. If you buy through
              them, we may earn a commission at no extra cost to you. Rankings are calculated from the data shown on
              each page.
            </p>
            <p className="muted">
              © {new Date().getFullYear()} {SITE_NAME}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
