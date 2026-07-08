# 海外 B2B 网站后台与 News 自动化实施计划

## 当前项目情况
- 原项目只有 Next.js 代理镜像层，没有真实后台、数据库、News 自动化、表单或测试。
- 本次已改为 Next.js App Router 真实站点，使用本地持久化 SQLite 数据库作为开发和自检数据库。

## 技术架构
- 前端：Next.js App Router + TypeScript + CSS。
- 后端：Next.js Route Handlers。
- 数据库：SQLite 本地持久化文件，生产建议替换为 PostgreSQL 并保留同等表结构。
- 认证：PBKDF2 密码哈希 + HttpOnly Cookie Session。
- 定时任务：`/api/admin/news/run` 支持管理员或 `CRON_SECRET` 调用。

## 数据库设计
核心表包括 users、sessions、roles、permissions、product_categories、products、media_assets、news_articles、news_products、news_sources、news_jobs、news_publication_audits、blog_articles、blog_products、form_submissions、analytics_events、seo_issues、sync_sources、sync_jobs、audit_logs、system_settings。

## 功能模块
- 前台：首页、产品、产品详情、News、News 详情、Blog、Blog 详情、搜索、联系表单。
- 后台：中文登录、数据概览、产品列表、新闻列表、客户表单、同步源、任务日志、每日审计。
- 自动化：News 候选校验、72 小时过滤、7 天去重、产品相关性、图片来源字段、发布审计。
- SEO/GEO：Metadata、canonical、Open Graph、Twitter Card、Product/NewsArticle/BlogPosting JSON-LD、sitemap、robots、RSS。

## 安全方案
- 密码哈希存储，不保存明文密码。
- 登录失败 15 分钟内 5 次锁定。
- 管理任务接口要求登录或 CRON_SECRET。
- 表单含 honeypot、后端校验、IP 哈希和审计日志。
- 外部 News 内容经过 HTML 清理，外部 API Key 仅使用环境变量。

## 测试方案
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm self-check`

## 部署方案
- 本地：`pnpm install && pnpm db:init && pnpm dev`
- 生产：配置环境变量，执行构建并部署到 Vercel 或 Node 服务。
- SQLite 适合本地和单机持久化；Vercel Serverless 生产建议接 PostgreSQL。

## 风险和待确认事项
- 真实外部新闻采集、AI 生成、邮件通知、SEO 外部数据同步需要 API Key 或第三方凭证。
- 当前自动发布在缺少真实来源时会记录失败，不伪造真实新闻。
- News/Blog 示例内容已明确标记为演示，不冒充真实新闻。
