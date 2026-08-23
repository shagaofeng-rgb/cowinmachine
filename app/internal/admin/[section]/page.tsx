import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminShell } from "@/components/admin/AdminShell";
import { getDashboardData, listLeads } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";

const sections = {
  analytics: { title: "流量分析", description: "基于访客同意的获客来源、设备、语言、页面和采购意向信号。", cards: ["访问会话", "独立访客", "页面浏览", "报价点击"] },
  leads: { title: "询盘与 RFQ", description: "网站询盘、筛选状态、产品上下文和来源归因。", cards: ["新增询盘", "总记录数", "报价点击", "WhatsApp 点击"] },
  products: { title: "产品洞察", description: "采购方实际查看的设备类目和产品参考信息。", cards: ["产品浏览", "热门类目", "热门产品", "询盘产品信息"] },
  news: { title: "新闻运营", description: "已发布新闻、来源轮换以及内容对产品浏览的贡献。", cards: ["已发布文章", "新闻浏览", "来源轮换", "内容转 RFQ"] },
  seo: { title: "SEO 中心", description: "Search Console 快照、站点地图状态、规范链接健康度和抓取跟进。", cards: ["站点地图健康度", "搜索快照", "索引问题", "技术检查"] },
  markets: { title: "市场与语言", description: "国家、地区、浏览器语言、设备和流量渠道分组。", cards: ["国家 / 地区", "语言", "桌面 / 移动端", "回访会话"] },
  "data-health": { title: "数据健康度", description: "同意状态、数据库连接、事件校验、保留策略和审计准备情况。", cards: ["数据库", "同意模型", "事件结构", "数据保留"] },
} as const;

type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ preset?: string; start?: string; end?: string }> };

export default async function AdminSectionPage({ params, searchParams }: Props) {
  const { section } = await params;
  const values = await searchParams;
  const sectionInfo = sections[section as keyof typeof sections];
  const config = contentAutomationConfig();
  if (!sectionInfo || !config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();
  const range = readAdminDateRange(values);
  const databaseReady = isAdminDatabaseConfigured();
  const [dashboard, leads] = databaseReady ? await Promise.all([getDashboardData(range), listLeads(range)]) : [null, null];

  const cardValues: Record<string, number | string> = {
    "访问会话": dashboard?.visits ?? "—", "独立访客": dashboard?.visitors ?? "—", "页面浏览": dashboard?.pageViews ?? "—", "报价点击": dashboard?.quoteClicks ?? "—",
    "新增询盘": leads?.total ?? "—", "总记录数": leads?.total ?? "—", "WhatsApp 点击": dashboard?.whatsappClicks ?? "—",
    "产品浏览": dashboard?.products.reduce((total, item) => total + item.views, 0) ?? "—", "热门类目": dashboard?.products[0]?.category ?? "—", "热门产品": dashboard?.products[0]?.slug ?? "—", "询盘产品信息": leads?.rows.filter((lead) => Boolean(lead.productModel)).length ?? "—",
    "已发布文章": "由新闻自动化管理", "新闻浏览": dashboard?.topPages.filter((item) => item.pagePath.startsWith("/news")).reduce((total, item) => total + item.views, 0) ?? "—", "来源轮换": "内容运营中可查看", "内容转 RFQ": "数据积累后显示",
    "站点地图健康度": "查看 sitemap / robots", "搜索快照": "连接 Search Console", "索引问题": "在 Search Console 查看", "技术检查": "规范链接和 404 检查",
    "国家 / 地区": dashboard?.countries.length ?? "—", "语言": "同意后记录", "桌面 / 移动端": "同意后记录", "回访会话": "回访会话后可用",
    "数据库": databaseReady ? "已连接" : "需要连接", "同意模型": "第一方访客同意", "事件结构": "已校验", "数据保留": "仅 IP 哈希",
  };

  return <AdminShell active={`/internal/admin/${section}`} range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">B2B 运营</p><h1>{sectionInfo.title}</h1><p>{sectionInfo.description}</p></div><Link className="button button-outline" href="/internal/admin">返回总览</Link></header>
    <AdminDateFilters range={range} pathname={`/internal/admin/${section}`} />
    <section className="admin-metric-grid">{sectionInfo.cards.map((label) => <AdminMetricCard key={label} label={label} value={cardValues[label]} detail={range.label} />)}</section>
    <section className="admin-panel"><p className="eyebrow">实施状态</p><h2>{databaseReady ? "访客同意后，数据采集处于启用状态。" : "模块已就绪，等待数据库连接。"}</h2>
      <p className="admin-muted">{section === "seo" ? "只有在配置获授权的 Google 连接后，才会显示 Search Console 数据。后台会记录来源、日期范围、国家、设备、查询词和落地页指标，但不会声称保证收录。" : section === "data-health" ? "报告中不会显示原始 IP 地址。配置哈希密钥后，仅会使用不可逆哈希处理安全信号；国家和设备分析仅使用最小必要字段。" : "大量数据通过已建立索引的日期范围和服务端分页读取。默认每页 25 条，并可选择 25、50 或 100 条。"}</p>
    </section>
  </AdminShell>;
}
