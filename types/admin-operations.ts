export type AdminDatePreset = "today" | "this-week" | "this-month" | "custom";

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
  customerId: string | null;
  visitorId: string | null;
};

export type PaginatedResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type VisitorRecord = {
  visitorId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  country: string | null;
  region: string | null;
  language: string | null;
  device: DeviceType;
  firstChannel: string | null;
  customerId: string | null;
  customerName: string | null;
  customerCompany: string | null;
  sessionCount: number;
  pageViews: number;
};

export type CustomerRecord = {
  id: string;
  name: string;
  company: string;
  email: string;
  whatsapp: string | null;
  country: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sourceChannel: string | null;
  visitorCount: number;
  leadCount: number;
  pageViews: number;
};

export type JourneyEvent = {
  id: string;
  occurredAt: string;
  eventName: string;
  pagePath: string;
  pageTitle: string | null;
  productCategory: string | null;
  productSlug: string | null;
  sessionId: string;
};

export const adminSections = [
  { href: "/internal/admin", label: "总览" },
  { href: "/internal/admin/visitors", label: "访客与访问轨迹" },
  { href: "/internal/admin/analytics", label: "流量分析" },
  { href: "/internal/admin/leads", label: "询盘与 RFQ" },
  { href: "/internal/admin/products", label: "产品洞察" },
  { href: "/internal/admin/news", label: "News / Blog" },
  { href: "/internal/admin/seo", label: "SEO 中心" },
  { href: "/internal/admin/markets", label: "市场与语言" },
  { href: "/internal/admin/data-health", label: "数据健康度" },
  { href: "/internal/content-operations", label: "内容自动化" },
] as const;