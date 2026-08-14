export type NewsCandidate = {
  url: string;
  sourceName: string;
  title: string;
  publishedAt: string;
  discoveredAt: string;
  productCategories: string[];
  industries: string[];
  summary: string;
  primaryFacts: string[];
  sourceQuality: "primary" | "authoritative-media" | "secondary";
  imageLicenseStatus: "not-usable" | "unknown" | "licensed";
  originalityRisk: "low" | "medium" | "high";
  eligibleForArticle: boolean;
  rejectionReason?: string;
};

export type NewsArticleQueueItem = {
  id: string;
  title: string;
  primaryProductFamily: string;
  primaryProductUrl: string;
  industry: string;
  scenario: string;
  searchIntent: string;
  targetKeywords: string[];
  newsAngle: string;
  requiredSources: string[];
  internalLinks: string[];
  priority: "high" | "medium" | "low";
  similarityKey: string;
  status: "research-ready" | "research-pending";
};
