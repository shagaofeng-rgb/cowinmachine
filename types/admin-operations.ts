export type AdminDatePreset = "today" | "yesterday" | "last-7-days" | "last-30-days" | "this-month" | "last-month" | "custom";

export type AdminDateRange = {
  preset: AdminDatePreset;
  start: string;
  end: string;
  label: string;
};

export type AnalyticsEventName =
  | "page_view"
  | "product_view"
  | "category_view"
  | "news_view"
  | "quote_click"
  | "whatsapp_click"
  | "email_click"
  | "inquiry_started"
  | "inquiry_submitted"
  | "filter_used";

export type DeviceType = "desktop" | "mobile" | "tablet" | "bot" | "unknown";

export type AnalyticsEventPayload = {
  eventId: string;
  visitorId: string;
  sessionId: string;
  eventName: AnalyticsEventName;
  pagePath: string;
  pageTitle?: string;
  referrer?: string;
  language?: string;
  timezone?: string;
  screen?: string;
  productCategory?: string;
  productSlug?: string;
  metadata?: Record<string, string | number | boolean>;
  utm?: Record<string, string>;
};

export type AdminMetric = {
  label: string;
  value: number;
  detail: string;
};

export type LeadStatus =
  | "new"
  | "qualified"
  | "technical-review"
  | "quotation-sent"
  | "negotiation"
  | "won"
  | "lost"
  | "nurture";

export type AdminLead = {
  id: string;
  createdAt: string;
  status: LeadStatus;
  name: string;
  company: string;
  country: string;
  email: string;
  whatsapp: string | null;
  category: string;
  productModel: string | null;
  application: string | null;
  quantity: string | null;
  sourceChannel: string | null;
  landingPath: string | null;
};

export type PaginatedResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export const adminSections = [
  { href: "/internal/admin", label: "总览" },
  { href: "/internal/admin/analytics", label: "流量分析" },
  { href: "/internal/admin/leads", label: "询盘与 RFQ" },
  { href: "/internal/admin/products", label: "产品洞察" },
  { href: "/internal/admin/news", label: "新闻运营" },
  { href: "/internal/admin/seo", label: "SEO 中心" },
  { href: "/internal/admin/markets", label: "市场与语言" },
  { href: "/internal/admin/data-health", label: "数据健康度" },
  { href: "/internal/content-operations", label: "内容自动化" },
] as const;
