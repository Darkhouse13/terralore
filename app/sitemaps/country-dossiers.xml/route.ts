import { sitemapGroupResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

export function GET(): Response {
  return sitemapGroupResponse("country-dossiers");
}
