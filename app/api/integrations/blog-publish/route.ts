export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keep the established webhook implementation and secret compatible while
// exposing a channel-accurate endpoint for all new integrations.
export { GET, POST } from "../news-publish/route";
