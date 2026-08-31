import { siteConfig } from "@/lib/site";

export function GET() {
  const content = `# ${siteConfig.brandName}

> Industrial equipment information and application-led configuration support for global B2B buyers.

## Primary pages
- ${siteConfig.siteUrl}/products: Equipment catalog
- ${siteConfig.siteUrl}/solutions: Application solution guides
- ${siteConfig.siteUrl}/news: Source-reviewed news and technical briefs
- ${siteConfig.siteUrl}/about: Company and publication policy
- ${siteConfig.siteUrl}/contact: Contact details and inquiry form
- ${siteConfig.siteUrl}/request-a-quote: Project inquiry

## Discovery
- ${siteConfig.siteUrl}/sitemap.xml
- ${siteConfig.siteUrl}/feed.xml

Product configuration, final specifications and suitability remain subject to application review.
`;

  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
