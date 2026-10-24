import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTool } from "@/lib/data";

/**
 * Affiliate redirect: /go/<tool-slug>
 * - Sends the visitor to the affiliate URL (or the vendor website as fallback).
 * - Logs the click to Supabase (table "clicks") when configured, so you can
 *   see which pages and tools earn money.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const tool = await getTool(slug);
  if (!tool) return NextResponse.redirect(new URL("/", req.url));

  const target = tool.affiliate_url || tool.website;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      await createClient(url, key, { auth: { persistSession: false } })
        .from("clicks")
        .insert({ tool_slug: slug, referer: req.headers.get("referer"), has_affiliate: !!tool.affiliate_url });
    } catch {
      // never block the redirect because of analytics
    }
  }
  const res = NextResponse.redirect(target, 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
