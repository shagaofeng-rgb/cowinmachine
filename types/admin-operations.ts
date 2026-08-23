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
  { href: "/internal/admin", label: "Overview" },
  { href: "/internal/admin/analytics", label: "Traffic analytics" },
  { href: "/internal/admin/leads", label: "Leads & RFQ" },
  { href: "/internal/admin/products", label: "Product intelligence" },
  { href: "/internal/admin/news", label: "News operations" },
  { href: "/internal/admin/seo", label: "SEO hub" },
  { href: "/internal/admin/markets", label: "Markets & languages" },
  { href: "/internal/admin/data-health", label: "Data health" },
  { href: "/internal/content-operations", label: "Content automation" },
] as const;
