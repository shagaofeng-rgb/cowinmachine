import { siteConfig } from "@/lib/site";

export function GET() {
  const content = "# " + siteConfig.brandName + "\n\n" +
    "> Industrial equipment information and application-led configuration support for global B2B buyers.\n\n" +
    "## Primary pages\n" +
    "- [Equipment catalog](" + siteConfig.siteUrl + "/products)\n" +
    "- [Application solution guides](" + siteConfig.siteUrl + "/solutions)\n" +
    "- [Source-reviewed industry news](" + siteConfig.siteUrl + "/news)\n" +
    "- [Equipment guidance blog](" + siteConfig.siteUrl + "/blog)\n" +
    "- [Company and publication policy](" + siteConfig.siteUrl + "/about)\n" +
    "- [Contact details and inquiry form](" + siteConfig.siteUrl + "/contact)\n" +
    "- [Project inquiry](" + siteConfig.siteUrl + "/request-a-quote)\n\n" +
    "## Discovery\n" +
    "- [XML sitemap](" + siteConfig.siteUrl + "/sitemap.xml)\n" +
    "- [News RSS feed](" + siteConfig.siteUrl + "/feed.xml)\n" +
    "- [Blog RSS feed](" + siteConfig.siteUrl + "/blog-feed.xml)\n\n" +
    "Product configuration, final specifications and suitability remain subject to application review.\n";

  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
