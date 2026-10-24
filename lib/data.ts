import "server-only";
import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Category, Comparison, Tool } from "./types";

import localCategories from "@/data/categories.json";
import localTools from "@/data/tools.json";
import localComparisons from "@/data/comparisons.json";

/**
 * Data access layer.
 * - If SUPABASE_URL + SUPABASE_ANON_KEY are set, data is read from Supabase.
 * - Otherwise the local JSON files in /data are used (handy for development).
 */

let client: SupabaseClient | null = null;
function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const sb = supabase();
  if (!sb) return localCategories as Category[];
  const { data, error } = await sb.from("categories").select("*").order("name");
  if (error) throw error;
  return data as Category[];
});

export const getTools = cache(async (): Promise<Tool[]> => {
  const sb = supabase();
  if (!sb) return localTools as unknown as Tool[];
  const { data, error } = await sb.from("tools").select("*").order("name");
  if (error) throw error;
  return data as Tool[];
});

/** Only published comparisons are ever exposed to the site (drip-feed gate). */
export const getPublishedComparisons = cache(async (): Promise<Comparison[]> => {
  const sb = supabase();
  if (!sb) {
    return (localComparisons as unknown as Comparison[]).filter((c) => c.status === "published");
  }
  const { data, error } = await sb
    .from("comparisons")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data as Comparison[];
});

export async function getCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getTool(slug: string) {
  return (await getTools()).find((t) => t.slug === slug) ?? null;
}

export async function getToolsByCategory(category: string) {
  return (await getTools()).filter((t) => t.category === category);
}

export async function getComparison(slug: string) {
  return (await getPublishedComparisons()).find((c) => c.slug === slug) ?? null;
}

export function pairSlug(a: string, b: string) {
  const [x, y] = [a, b].sort();
  return `${x}-vs-${y}`;
}

/**
 * Hub & spoke internal linking: comparisons that share a tool come first,
 * then the rest of the same category. Never returns the page itself.
 */
export async function getRelatedComparisons(current: Comparison, limit = 6) {
  const all = await getPublishedComparisons();
  const sameCat = all.filter((c) => c.category === current.category && c.slug !== current.slug);
  const shared = sameCat.filter(
    (c) => [c.tool_a, c.tool_b].some((t) => t === current.tool_a || t === current.tool_b),
  );
  const rest = sameCat.filter((c) => !shared.includes(c));
  return [...shared, ...rest].slice(0, limit);
}

export async function getComparisonsForTool(toolSlug: string) {
  return (await getPublishedComparisons()).filter(
    (c) => c.tool_a === toolSlug || c.tool_b === toolSlug,
  );
}
