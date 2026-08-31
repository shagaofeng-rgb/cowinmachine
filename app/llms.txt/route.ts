import { siteConfig } from "@/lib/site";

export function GET() {
  const content = `# ${siteConfig.brandName}

> Industrial equipment information and application-led configuration support for global B2B buyers.

## Primary pages
- [Equipment catalog](${siteConfig.siteUrl}/products)
- [Application solution guides](${siteConfig.siteUrl}/solutions)
- [Source-reviewed news and technical briefs](${siteConfig.siteUrl}/news)
- [Company and publication policy](${siteConfig.siteUrl}/about)
- [Contact details and inquiry form](${siteConfig.siteUrl}/contact)
- [Project inquiry](${siteConfig.siteUrl}/request-a-quote)

## Discovery
- [XML sitemap](${siteConfig.siteUrl}/sitemap.xml)
- [News RSS feed](${siteConfig.siteUrl}/feed.xml)

Product configuration, final specifications and suitability remain subject to application review.
`;

  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
