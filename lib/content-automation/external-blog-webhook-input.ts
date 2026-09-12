export type ExternalBlogWebhookInput = {
  secretCandidates: string[];
  classId: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
};

type Payload = Record<string, unknown>;

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maximum) : "";
}

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function first(payload: Payload, names: string[], maximum: number, formatter = clean) {
  for (const name of names) {
    const value = formatter(payload[name], maximum);
    if (value) return value;
  }
  return "";
}

function basicAuthorizationCandidates(authorization: string | null) {
  if (!authorization?.startsWith("Basic ")) return [];
  try {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    return separator < 0 ? [decoded] : [decoded.slice(0, separator), decoded.slice(separator + 1)];
  } catch {
    return [];
  }
}

export function normalizeExternalBlogWebhookInput(payload: Payload, headers: Headers): ExternalBlogWebhookInput {
  const authorization = headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const secretCandidates = [
    first(payload, ["sign"], 512),
    first(payload, ["api_key", "apiKey", "API_KEY"], 512),
    first(payload, ["api_pass", "apiPass", "API_PASS"], 512),
    headers.get("x-api-key")?.trim() ?? "",
    bearer.trim(),
    ...basicAuthorizationCandidates(authorization),
  ].filter(Boolean);

  return {
    secretCandidates: [...new Set(secretCandidates)],
    classId: first(payload, ["class_id", "classId", "category_id", "categoryId"], 80),
    title: first(payload, ["title", "article_title", "post_title"], 240),
    content: first(payload, ["content", "article_content", "post_content", "body"], 160_000, text),
    authorId: first(payload, ["author_id", "authorId", "author", "admin"], 120),
    imageUrl: first(payload, ["image_url", "imageUrl", "cover_url", "coverUrl", "image"], 2_000),
  };
}
