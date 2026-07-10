import { buildSitemapBundle } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const bundle = buildSitemapBundle();
  return new Response(bundle.indexXml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
