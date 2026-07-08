export function canonicalizeUrl(value: string): string;
export function slugify(value: string): string;
export function withinLookback(sourcePublishedAt: string, now?: Date, hours?: number): boolean;
export function fingerprint(parts: Array<string | null | undefined>): string;
export function scoreRelevance<T extends { name?: string; english_name?: string; sku?: string; tags?: string; category_name?: string }>(
  text: string,
  products: T[],
): { score: number; product: T | null; reason: string };
export function sanitizeHtml(html: string): string;
