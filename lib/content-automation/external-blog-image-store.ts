import "server-only";

import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import {
  externalBlogImageExtension,
  MAX_EXTERNAL_BLOG_IMAGE_BYTES,
  normalizeExternalBlogImageMimeType,
  validateExternalBlogImageUrl,
} from "@/lib/content-automation/external-blog-image-policy";
import type { ContentImage } from "@/types/content-automation";

export type ExternalBlogImageStoreStatus = "stored-external" | "external-omitted" | "invalid" | "storage-unavailable";

type StoreExternalBlogImageInput = {
  imageUrl: string;
  title: string;
  digest: string;
};

type StoreExternalBlogImageResult = {
  status: ExternalBlogImageStoreStatus;
  image?: ContentImage;
  reason?: string;
};

async function readImageBody(response: Response) {
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_EXTERNAL_BLOG_IMAGE_BYTES) {
    throw new Error("image-too-large");
  }

  if (!response.body) throw new Error("image-response-empty");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_EXTERNAL_BLOG_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("image-too-large");
    }
    chunks.push(value);
  }
  const image = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    image.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return image.buffer;
}

export async function storeExternalBlogImage(input: StoreExternalBlogImageInput): Promise<StoreExternalBlogImageResult> {
  const source = validateExternalBlogImageUrl(input.imageUrl);
  if (!source) return { status: "invalid", reason: "image-url-not-allowed" };

  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const hasVercelOidc = Boolean(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);
  if (!hasBlobToken && !hasVercelOidc) {
    return { status: "storage-unavailable", reason: "blob-storage-not-configured" };
  }

  try {
    const response = await fetch(source, {
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { status: "external-omitted", reason: "image-fetch-failed" };

    const mimeType = normalizeExternalBlogImageMimeType(response.headers.get("content-type"));
    if (!mimeType) return { status: "invalid", reason: "image-content-type-not-allowed" };

    const body = await readImageBody(response);
    const fileDigest = createHash("sha256").update(input.digest).update(source.href).digest("hex").slice(0, 16);
    const blob = await put(`external-blog/${input.digest.slice(0, 16)}-${fileDigest}.${externalBlogImageExtension(mimeType)}`, new Blob([body], { type: mimeType }), {
      access: "public",
      addRandomSuffix: true,
      contentType: mimeType,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
      maximumSizeInBytes: MAX_EXTERNAL_BLOG_IMAGE_BYTES,
    });

    return {
      status: "stored-external",
      image: {
        src: blob.url,
        alt: `${input.title} - COWIN MACHINE Blog`,
        source: "user-provided",
        licenseStatus: "authorized",
      },
    };
  } catch (error) {
    const reason = error instanceof Error && error.message === "image-too-large" ? "image-too-large" : "image-storage-failed";
    return { status: "external-omitted", reason };
  }
}
