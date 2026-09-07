export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Legacy compatibility route. Third-party publication is Blog-only.
export { GET, POST } from "@/lib/content-automation/external-blog-publisher";
