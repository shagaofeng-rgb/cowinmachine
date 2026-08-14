export type ContentMode = "draft" | "publish";
export type ContentStatus = "queued" | "drafted" | "pending-review" | "published" | "blocked";
export type DiscoveryStatus = "published" | "included-in-sitemap" | "discovery-pending" | "crawl-status-unknown" | "indexed-confirmed" | "not-indexed";

export type ContentSource = {
  id: string;
  name: string;
  url: string;
  publishedAt: string;
  sourceQuality: "primary" | "authoritative-media" | "secondary";
  primaryFact: string;
};

export type ContentImage = {
  src: string;
  alt: string;
  source: "cowin-machine-authorized" | "user-provided" | "commercially-licensed";
  licenseStatus: "authorized" | "not-required";
};

export type ContentQualityReport = {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  titleSimilarity: number;
  bodySimilarity: number;
  internalLinkCount: number;
};

export type ContentArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  productFamily: string;
  productUrl: string;
  industry: string;
  scenario: string;
  similarityKey: string;
  sources: ContentSource[];
  internalLinks: string[];
  image?: ContentImage;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  discoveryStatus: DiscoveryStatus;
  qualityReport: ContentQualityReport;
};

export type ContentAutomationState = {
  version: 1;
  articles: ContentArticle[];
  runs: Array<{ id: string; startedAt: string; mode: ContentMode; dryRun: boolean; result: string }>;
};
