import crypto from "node:crypto";

export function canonicalizeUrl(value) {
  const url = new URL(value);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"]) {
    url.searchParams.delete(key);
  }
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  return url.toString().replace(/\/$/, "");
}

export function slugify(value) {
  return (
    String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || crypto.randomBytes(4).toString("hex")
  );
}

export function withinLookback(sourcePublishedAt, now = new Date(), hours = 72) {
  const published = new Date(sourcePublishedAt).getTime();
  return Number.isFinite(published) && published <= now.getTime() && now.getTime() - published <= hours * 60 * 60 * 1000;
}

export function fingerprint(parts) {
  return crypto.createHash("sha256").update(parts.filter(Boolean).join("|").toLowerCase()).digest("hex");
}

export function scoreRelevance(text, products) {
  const haystack = String(text || "").toLowerCase();
  let best = { score: 0, product: null, reason: "未匹配到产品关键词" };
  for (const product of products) {
    const keywords = [product.name, product.category_name, product.sku, ...(product.tags || "").split(",")].filter(Boolean);
    const hits = keywords.filter((keyword) => haystack.includes(String(keyword).toLowerCase())).length;
    const score = Math.min(1, hits / Math.max(3, keywords.length / 2));
    if (score > best.score) best = { score, product, reason: `匹配 ${hits} 个产品、分类或标签关键词` };
  }
  return best;
}

export function sanitizeHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}
