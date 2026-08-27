import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

/**
 * Answer-engine and AI crawlers, listed explicitly.
 *
 * Terralore is a sourced encyclopedia — being read, quoted and cited by answer
 * engines is the point, not a leak. These agents are already covered by the
 * `*` rule below; naming them is a deliberate, unambiguous opt-in so no future
 * blanket policy accidentally locks them out.
 */
const ANSWER_ENGINE_AGENTS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google (AI/Gemini training + grounding opt-in)
  "Google-Extended",
  // Common Crawl
  "CCBot",
  // Apple
  "Applebot-Extended",
  // Microsoft
  "Bingbot",
  // Amazon
  "Amazonbot",
  // Meta
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: ANSWER_ENGINE_AGENTS,
        allow: "/",
      },
    ],
    // No `host` directive: it was a Yandex-only extension, deprecated by
    // Yandex itself in 2018 — canonical-host signaling is done by the
    // www→apex/http→https 301s and consistent canonical tags.
    sitemap: abs("/sitemap.xml"),
  };
}
