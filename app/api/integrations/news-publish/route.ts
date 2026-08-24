import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { contentStore } from "@/lib/content-automation/storage";
import type { ContentArticle, ContentImage } from "@/types/content-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookInput = {
  sign: string;
  classId: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
};

function response(code: 0 | 1, msg: string, status = 200) {
  return NextResponse.json({ code, msg }, { status, headers: { "Cache-Control": "no-store" } });
}

function sameSecret(received: string, expected: string) {
  const first = Buffer.from(received);
  const second = Buffer.from(expected);
  return first.length === second.length && timingSafeEqual(first, second);
}

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maximum) : "";
}

function htmlToMarkdown(value: string) {
  const lineBreaks = value
    .replace(/\r/g, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n\n")
    .replace(/<\s*h[23][^>]*>/gi, "\n## ")
    .replace(/<\s*\/\s*h[1-6]\s*>/gi, "\n\n")
    .replace(/<\s*li[^>]*>/gi, "\n- ")
    .replace(/<\s*\/\s*li\s*>/gi, "")
    .replace(/<[^>]*>/g, "");
  return lineBreaks
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 120_000);
}

function localImage(imageUrl: string, title: string): ContentImage | undefined {
  if (!imageUrl) return undefined;
  try {
    const url = new URL(imageUrl);
    if (!["https://cowinmachine.com", "https://www.cowinmachine.com"].includes(url.origin)) return undefined;
    if (!/\.(avif|gif|jpe?g|png|webp)$/i.test(url.pathname)) return undefined;
    return {
      src: url.pathname,
      alt: `${title} — COWIN MACHINE News`,
      source: "user-provided",
      licenseStatus: "authorized",
    };
  } catch {
    return undefined;
  }
}

async function readInput(request: Request): Promise<WebhookInput> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
    return {
      sign: clean(payload.sign, 512),
      classId: clean(payload.class_id, 80),
      title: clean(payload.title, 240),
      content: typeof payload.content === "string" ? payload.content : "",
      authorId: clean(payload.author_id, 120),
      imageUrl: clean(payload.image_url, 2_000),
    };
  }

  const form = await request.formData().catch(() => null);
  const read = (name: string, maximum: number) => clean(form?.get(name), maximum);
  return {
    sign: read("sign", 512),
    classId: read("class_id", 80),
    title: read("title", 240),
    content: typeof form?.get("content") === "string" ? String(form.get("content")) : "",
    authorId: read("author_id", 120),
    imageUrl: read("image_url", 2_000),
  };
}

export async function POST(request: Request) {
  const rawExpectedSecret = process.env.EXTERNAL_NEWS_WEBHOOK_SECRET;
  const expectedSecret = rawExpectedSecret?.trim();
  if (!expectedSecret) return response(0, "发布接口未配置");
  const input = await readInput(request);

  if (!input.sign || !sameSecret(input.sign, expectedSecret)) {
    console.warn("external-news-webhook-auth-failed", {
      configuredLength: rawExpectedSecret?.length ?? 0,
      normalizedLength: expectedSecret.length,
      receivedLength: input.sign.length,
    });
    return response(0, "秘钥错误", 401);
  }
  const configuredClassId = process.env.EXTERNAL_NEWS_WEBHOOK_CLASS_ID ?? "31";
  const isHandshake = !input.title && !input.content;
  if (isHandshake) return response(1, "接口验证成功");

  const title = clean(input.title, 200);
  const body = htmlToMarkdown(input.content);
  if (title.length < 8 || body.length < 80) return response(0, "文章标题或内容不完整", 422);

  const image = localImage(input.imageUrl, title);
  if (input.imageUrl && !image) return response(0, "封面图必须是本站已授权的 HTTPS 图片地址", 422);

  const digest = createHash("sha256").update(`${title}\n${body}`).digest("hex");
  const similarityKey = `external-webhook:${digest}`;
  const store = contentStore();

  try {
    const state = await store.read();
    if (state.articles.some((article) => article.similarityKey === similarityKey)) {
      return response(1, "发布成功（重复请求已忽略）");
    }

    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "industry-news";
    const now = new Date().toISOString();
    const article: ContentArticle = {
      id: randomUUID(),
      slug: `${slugBase}-${digest.slice(0, 10)}`,
      title,
      summary: body.replace(/^##[^\n]*\n?/, "").replace(/\s+/g, " ").slice(0, 330),
      body,
      productFamily: "external-news",
      productUrl: "/products",
      industry: "Industry news",
      scenario: "Third-party editorial publication",
      similarityKey,
      sources: [],
      internalLinks: ["/products", "/solutions", "/request-a-quote"],
      image,
      status: "published",
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      discoveryStatus: "included-in-sitemap",
      qualityReport: {
        passed: true,
        checks: [
          { name: "webhook-authentication", passed: true, detail: "Shared secret accepted." },
          { name: "category-routing", passed: true, detail: `External class_id ${input.classId || "not supplied"} mapped to ${configuredClassId}.` },
          { name: "cover-image-rights", passed: Boolean(!input.imageUrl || image), detail: input.imageUrl ? "Authorized local image path accepted." : "No cover image supplied." },
          { name: "source-author", passed: true, detail: input.authorId ? "Third-party author identifier received." : "No author identifier supplied." },
        ],
        titleSimilarity: 0,
        bodySimilarity: 0,
        internalLinkCount: 3,
      },
    };
    await store.write({ ...state, articles: [article, ...state.articles], runs: [...state.runs, { id: `external-webhook-${article.id}`, startedAt: now, mode: "publish", dryRun: false, result: "published" }] });
    revalidatePath("/news");
    revalidatePath(`/news/${article.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    return response(1, "发布成功");
  } catch (error) {
    console.error("external-news-webhook-failed", error instanceof Error ? error.message : "unknown");
    return response(0, "数据录入失败，请重试", 503);
  }
}

export async function GET() {
  return response(0, "仅支持 POST 请求", 405);
}
