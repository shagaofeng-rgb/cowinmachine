import { getSitemapFile } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const file = getSitemapFile(`sitemaps/${name}`);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
