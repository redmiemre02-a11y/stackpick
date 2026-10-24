import type { Tool } from "@/lib/types";

/** Affiliate CTA. Always routed through /go/[slug] so clicks can be tracked. */
export default function CtaButton({ tool, variant = "primary" }: { tool: Tool; variant?: "primary" | "ghost" }) {
  return (
    <a className={`btn ${variant}`} href={`/go/${tool.slug}`} rel="sponsored nofollow noopener" target="_blank">
      Try {tool.name} →
    </a>
  );
}
