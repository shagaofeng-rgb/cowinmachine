import type { ContentArticle, ContentChannel } from "@/types/content-automation";

export const legacyThirdPartyBlogFamilies = [
  "external-blog",
  "external-news",
  "external-webhook",
] as const;

const legacyThirdPartyBlogFamilySet = new Set<string>(legacyThirdPartyBlogFamilies);

export function isThirdPartyBlogFamily(productFamily: string) {
  return legacyThirdPartyBlogFamilySet.has(productFamily);
}

export function getContentArticleChannel(article: Pick<ContentArticle, "channel" | "productFamily">): ContentChannel {
  if (article.channel) return article.channel;
  return isThirdPartyBlogFamily(article.productFamily) ? "blog" : "news";
}
