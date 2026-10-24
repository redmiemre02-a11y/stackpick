import type { Category, Tool } from "./types";

/**
 * Deterministic, data-driven insights. These make every page unique even
 * before (or without) AI enrichment, because they are computed from the
 * actual attribute differences between two tools.
 */

export function monthlyCost(tool: Tool, seats: number): number | null {
  const p = tool.pricing.starting_price_usd;
  if (p == null) return null;
  return tool.pricing.billing === "per_seat" ? p * seats : p;
}

export function formatUsd(n: number | null) {
  if (n == null) return "Custom";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function featureCoverage(tool: Tool, category: Category) {
  const total = category.features.length;
  const have = category.features.filter((f) => tool.features[f.key]).length;
  return { have, total, pct: Math.round((have / total) * 100) };
}

export function featureDiff(a: Tool, b: Tool, category: Category) {
  const onlyA = category.features.filter((f) => a.features[f.key] && !b.features[f.key]);
  const onlyB = category.features.filter((f) => b.features[f.key] && !a.features[f.key]);
  const both = category.features.filter((f) => a.features[f.key] && b.features[f.key]);
  const neither = category.features.filter((f) => !a.features[f.key] && !b.features[f.key]);
  return { onlyA, onlyB, both, neither };
}

/** Jaccard similarity on features + price proximity → used for alternatives. */
export function similarity(a: Tool, b: Tool, category: Category) {
  const keys = category.features.map((f) => f.key);
  const inter = keys.filter((k) => a.features[k] && b.features[k]).length;
  const union = keys.filter((k) => a.features[k] || b.features[k]).length || 1;
  const pa = a.pricing.starting_price_usd ?? 0;
  const pb = b.pricing.starting_price_usd ?? 0;
  const priceProx = 1 - Math.min(Math.abs(pa - pb) / Math.max(pa, pb, 1), 1);
  return 0.75 * (inter / union) + 0.25 * priceProx;
}

/** A transparent 0–100 score so rankings are explainable, not invented. */
export function dataScore(tool: Tool, category: Category, peers: Tool[]) {
  const cov = featureCoverage(tool, category).pct; // 0–100
  const prices = peers.map((p) => p.pricing.starting_price_usd ?? 0).filter((p) => p > 0);
  const max = Math.max(...prices, 1);
  const min = Math.min(...prices, max);
  const price = tool.pricing.starting_price_usd ?? max;
  const value = max === min ? 100 : Math.round(((max - price) / (max - min)) * 100);
  const free = tool.pricing.free_plan ? 100 : 0;
  return Math.round(cov * 0.6 + value * 0.25 + free * 0.15);
}

export function quickFacts(a: Tool, b: Tool, category: Category): string[] {
  const facts: string[] = [];
  const pa = a.pricing.starting_price_usd;
  const pb = b.pricing.starting_price_usd;
  if (pa != null && pb != null && pa !== pb) {
    const [cheap, pricey] = pa < pb ? [a, b] : [b, a];
    const cp = Math.min(pa, pb);
    const ep = Math.max(pa, pb);
    const pct = Math.round(((ep - cp) / ep) * 100);
    facts.push(
      `${cheap.name}'s entry plan (${formatUsd(cp)}) is ${pct}% cheaper than ${pricey.name}'s (${formatUsd(ep)}).`,
    );
  } else if (pa != null && pa === pb) {
    facts.push(`Both start at ${formatUsd(pa)} on their entry paid plan.`);
  }
  if (a.pricing.billing !== b.pricing.billing) {
    const seat = a.pricing.billing === "per_seat" ? a : b;
    const flat = seat === a ? b : a;
    facts.push(
      `${seat.name} charges per user while ${flat.name} uses a flat price, so ${flat.name} gets relatively cheaper as your team grows.`,
    );
  }
  if (a.pricing.free_plan !== b.pricing.free_plan) {
    const free = a.pricing.free_plan ? a : b;
    const paid = free === a ? b : a;
    facts.push(`${free.name} has a free plan; ${paid.name} does not.`);
  } else if (a.pricing.free_plan) {
    facts.push("Both offer a free plan, so you can test them side by side at no cost.");
  }
  const d = featureDiff(a, b, category);
  if (d.onlyA.length) facts.push(`Only ${a.name} offers: ${d.onlyA.map((f) => f.label.toLowerCase()).join(", ")}.`);
  if (d.onlyB.length) facts.push(`Only ${b.name} offers: ${d.onlyB.map((f) => f.label.toLowerCase()).join(", ")}.`);
  if (!d.onlyA.length && !d.onlyB.length) {
    facts.push(`They cover the same ${d.both.length} of ${category.features.length} core features we track, so price and UX decide.`);
  }
  return facts;
}
