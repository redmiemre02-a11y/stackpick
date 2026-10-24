export type Billing = "per_seat" | "flat";

export interface FeatureDef {
  key: string;
  label: string;
}

export interface Category {
  slug: string;
  name: string;
  short: string;
  description: string;
  features: FeatureDef[];
}

export interface Tool {
  slug: string;
  name: string;
  category: string;
  website: string;
  affiliate_url: string | null;
  founded: number | null;
  tagline: string;
  pricing: {
    free_plan: boolean;
    starting_price_usd: number | null;
    billing: Billing;
  };
  features: Record<string, boolean>;
  best_for: string[];
  last_verified: string | null;
}

export interface UseCaseWinner {
  use_case: string;
  winner: string; // tool slug or "tie"
  reason: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Structured output produced by the Gemini enrichment step. */
export interface ComparisonAI {
  summary: string;
  verdict: string;
  winner_overall: string; // tool slug or "tie"
  use_cases: UseCaseWinner[];
  pros_a: string[];
  cons_a: string[];
  pros_b: string[];
  cons_b: string[];
  faq: FaqItem[];
  model?: string;
  generated_at?: string;
}

export type PublishStatus = "draft" | "published";

export interface Comparison {
  slug: string; // "<a>-vs-<b>" with a < b alphabetically
  category: string;
  tool_a: string;
  tool_b: string;
  status: PublishStatus;
  published_at: string | null;
  ai: ComparisonAI | null;
}
