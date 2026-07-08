import { NextResponse } from "next/server";
import { articleBySlug, relatedProductsForArticle } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleBySlug("news", slug);
  if (!article) return NextResponse.json({ error: { code: "NOT_FOUND", message: "新闻不存在" } }, { status: 404 });
  return NextResponse.json({ data: article, relatedProducts: relatedProductsForArticle("news", article.id) });
}
