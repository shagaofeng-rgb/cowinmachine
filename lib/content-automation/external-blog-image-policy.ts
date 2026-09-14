const IMAGE_EXTENSIONS = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const MAX_EXTERNAL_BLOG_IMAGE_BYTES = 5 * 1024 * 1024;

export type ExternalBlogImageMimeType = keyof typeof IMAGE_EXTENSIONS;

export function normalizeExternalBlogImageMimeType(value: string | null) {
  const normalized = value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return normalized in IMAGE_EXTENSIONS ? normalized as ExternalBlogImageMimeType : undefined;
}

export function externalBlogImageExtension(mimeType: ExternalBlogImageMimeType) {
  return IMAGE_EXTENSIONS[mimeType];
}

function isPrivateAddress(hostname: string) {
  if (hostname === "::1" || hostname === "0.0.0.0") return true;
  if (/^127(?:\.\d{1,3}){3}$/.test(hostname)) return true;
  if (/^10(?:\.\d{1,3}){3}$/.test(hostname)) return true;
  if (/^192\.168(?:\.\d{1,3}){2}$/.test(hostname)) return true;

  const match = hostname.match(/^172\.(\d{1,3})(?:\.\d{1,3}){2}$/);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

export function validateExternalBlogImageUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) return undefined;
    if (isPrivateAddress(hostname)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}
