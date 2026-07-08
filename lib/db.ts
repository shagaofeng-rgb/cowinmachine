import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalizeUrl, fingerprint } from "./core.mjs";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "site.db");
let instance: Database.Database | null = null;

export type Product = {
  id: number;
  name: string;
  english_name: string;
  sku: string;
  slug: string;
  category_id: number;
  category_name?: string;
  summary: string;
  description: string;
  applications: string;
  features: string;
  specifications: string;
  tags: string;
  image_url: string;
  status: string;
  seo_title: string;
  seo_description: string;
  updated_at: string;
};

export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  language: string;
  cover_image_url: string;
  cover_image_source_url: string;
  cover_image_page_url: string;
  cover_image_alt: string;
  author_name: string;
  published_at: string;
  updated_at: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  geo_summary: string;
  key_takeaways: string;
  source_title: string;
  source_author: string;
  source_publisher: string;
  source_url: string;
  canonical_source_url: string;
  source_language: string;
  source_published_at: string;
  source_fetched_at: string;
  source_fingerprint: string;
  event_fingerprint: string;
  relevance_score: number;
  generation_model: string;
  generation_prompt_version: string;
};

export function db() {
  if (instance) return instance;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  migrate(instance);
  seed(instance);
  return instance;
}

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '只读用户',
      locked_until TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ip TEXT,
      success INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      UNIQUE(role, module, action)
    );
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      english_name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parent_id INTEGER REFERENCES product_categories(id),
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      show_in_nav INTEGER NOT NULL DEFAULT 1,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      english_name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      category_id INTEGER NOT NULL REFERENCES product_categories(id),
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      applications TEXT NOT NULL,
      features TEXT NOT NULL,
      specifications TEXT NOT NULL,
      tags TEXT NOT NULL,
      image_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      is_featured INTEGER NOT NULL DEFAULT 0,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      alt_text TEXT NOT NULL,
      source_url TEXT,
      uploaded_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS news_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      cover_image_url TEXT NOT NULL,
      cover_image_source_url TEXT NOT NULL,
      cover_image_page_url TEXT NOT NULL,
      cover_image_alt TEXT NOT NULL,
      author_name TEXT NOT NULL,
      category_id INTEGER REFERENCES news_categories(id),
      published_at TEXT,
      scheduled_at TEXT,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      canonical_url TEXT NOT NULL,
      primary_keyword TEXT NOT NULL,
      secondary_keywords TEXT NOT NULL,
      geo_summary TEXT NOT NULL,
      key_takeaways TEXT NOT NULL,
      source_title TEXT NOT NULL,
      source_author TEXT,
      source_publisher TEXT NOT NULL,
      source_url TEXT NOT NULL,
      canonical_source_url TEXT NOT NULL,
      source_language TEXT NOT NULL,
      source_published_at TEXT NOT NULL,
      source_fetched_at TEXT NOT NULL,
      source_timezone TEXT NOT NULL,
      source_fingerprint TEXT NOT NULL,
      event_fingerprint TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      relevance_score REAL NOT NULL,
      credibility_score REAL NOT NULL,
      generation_model TEXT NOT NULL,
      generation_prompt_version TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS news_products (
      news_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      relevance_score REAL NOT NULL,
      relationship_reason TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(news_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS news_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL UNIQUE,
      publisher_name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      rss_url TEXT,
      language TEXT NOT NULL,
      country TEXT NOT NULL,
      credibility_score REAL NOT NULL DEFAULT 0.7,
      enabled INTEGER NOT NULL DEFAULT 1,
      allowed_for_auto_publish INTEGER NOT NULL DEFAULT 0,
      last_fetched_at TEXT,
      failure_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS news_jobs (
      id TEXT PRIMARY KEY,
      job_type TEXT NOT NULL,
      status TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      metadata TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS news_publication_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      timezone TEXT NOT NULL,
      target_count INTEGER NOT NULL,
      published_count INTEGER NOT NULL,
      missing_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS blog_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      cover_image_url TEXT NOT NULL,
      cover_image_source_url TEXT NOT NULL,
      cover_image_page_url TEXT NOT NULL,
      cover_image_alt TEXT NOT NULL,
      author_name TEXT NOT NULL,
      published_at TEXT,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      canonical_url TEXT NOT NULL,
      geo_summary TEXT NOT NULL,
      key_takeaways TEXT NOT NULL,
      source_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS blog_products (
      blog_id INTEGER NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      relevance_score REAL NOT NULL,
      relationship_reason TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(blog_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS form_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_no TEXT NOT NULL UNIQUE,
      form_type TEXT NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      country TEXT,
      message TEXT NOT NULL,
      product_id INTEGER REFERENCES products(id),
      source_page TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      ip_hash TEXT,
      status TEXT NOT NULL DEFAULT '新询盘',
      owner TEXT,
      tags TEXT NOT NULL DEFAULT '',
      internal_note TEXT NOT NULL DEFAULT '',
      consent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      page_url TEXT NOT NULL,
      product_id INTEGER,
      article_id INTEGER,
      country TEXT,
      device TEXT,
      source TEXT,
      visitor_hash TEXT,
      consent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS analytics_daily_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      page_views INTEGER NOT NULL DEFAULT 0,
      unique_visitors INTEGER NOT NULL DEFAULT 0,
      product_views INTEGER NOT NULL DEFAULT 0,
      news_views INTEGER NOT NULL DEFAULT 0,
      form_submissions INTEGER NOT NULL DEFAULT 0,
      conversions INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS seo_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      page_url TEXT NOT NULL,
      suggestion TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      owner TEXT,
      detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sync_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      source_type TEXT NOT NULL,
      configured INTEGER NOT NULL DEFAULT 0,
      connection_status TEXT NOT NULL DEFAULT '尚未配置',
      last_success_at TEXT,
      next_scheduled_at TEXT,
      recent_error TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_jobs (
      id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      success_count INTEGER NOT NULL DEFAULT 0,
      failure_count INTEGER NOT NULL DEFAULT 0,
      retry_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      object_type TEXT,
      object_id TEXT,
      before_summary TEXT,
      after_summary TEXT,
      ip TEXT,
      user_agent TEXT,
      result TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_news_status_published ON news_articles(status, published_at);
    CREATE INDEX IF NOT EXISTS idx_news_source_dedup ON news_articles(canonical_source_url, source_fingerprint, source_published_at);
    CREATE INDEX IF NOT EXISTS idx_blog_status_published ON blog_articles(status, published_at);
    CREATE INDEX IF NOT EXISTS idx_forms_status_created ON form_submissions(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_seo_status ON seo_issues(status, severity);
  `);
}

function seed(sqlite: Database.Database) {
  const insertRole = sqlite.prepare("INSERT OR IGNORE INTO roles(name, description) VALUES (?, ?)");
  for (const role of ["超级管理员", "管理员", "内容编辑", "市场人员", "销售人员", "数据分析人员", "只读用户"]) {
    insertRole.run(role, `${role}默认角色`);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (adminEmail && adminPassword && !adminPassword.includes("change-this")) {
    const exists = sqlite.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);
    if (!exists) {
      sqlite.prepare("INSERT INTO users(email, name, password_hash, role) VALUES (?, ?, ?, ?)").run(adminEmail, "初始管理员", hashPassword(adminPassword), "超级管理员");
    }
  }

  const existing = sqlite.prepare("SELECT COUNT(*) as count FROM product_categories").get() as { count: number };
  if (existing.count > 0) return;

  const catStmt = sqlite.prepare(`INSERT INTO product_categories
    (name, english_name, slug, summary, description, image_url, sort_order, seo_title, seo_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const categories = [
    ["自动立式包装机系列", "Automatic Vertical Packaging Machine Series", "automatic-vertical-packaging-machine-series", "适用于颗粒、粉末、液体和酱料的自动计量包装。"],
    ["封口机系列", "Sealing Machine Series", "sealing-machine-series", "面向食品、日化、医药包装的封口设备。"],
    ["喷码与打码设备", "Coding Machine Series", "coding-machine-series", "为包装线提供日期、批号和追溯编码。"],
  ];
  categories.forEach(([name, english, slug, summary], index) => {
    catStmt.run(name, english, slug, summary, `${summary} 后台支持 SEO、导航显示、排序和多语言扩展。`, externalImage(index), index, `${english} | Lianteng`, summary);
  });

  const productStmt = sqlite.prepare(`INSERT INTO products
    (name, english_name, sku, slug, category_id, summary, description, applications, features, specifications, tags, image_url, is_featured, seo_title, seo_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const productRows = [
    ["LT-320K 颗粒包装机", "LT-320K Granule Packing Machine", "LT-320K", "lt-320k-granule-packing-machine", 1, "面向颗粒物料的小袋自动包装设备。", "适用于食品、药品和日化颗粒物料的计量、制袋、填充、封合和切断。", "茶叶、糖果、调味料、药片、五金小件", "自动计量,稳定封口,可扩展打码,适合连续生产", "包装速度: 20-60 bags/min; 袋宽: 50-150mm", "granule,packing,vertical,food", externalImage(3), 1],
    ["连续薄膜封口机", "Continuous Film Sealing Machine", "DBF-1000", "continuous-film-sealing-machine", 2, "用于袋装产品连续封口。", "适用于塑料袋、复合膜袋等包装材料的连续热封，可与输送线配合使用。", "食品袋、药品袋、日用品袋", "连续作业,封口平整,温控稳定,维护简单", "封口宽度: 6-12mm; 速度: 0-12m/min", "sealing,film,bags,food", externalImage(4), 1],
    ["光纤激光喷码机", "Fiber Laser Coding Machine", "FL-20W", "fiber-laser-coding-machine", 3, "用于金属和硬质材料永久标识。", "适用于包装产线上的日期、批号、二维码和追溯码标刻。", "瓶盖、金属件、电子元件、包装盒", "免耗材,标识清晰,适合高速产线,支持追溯码", "功率: 20W; 标刻范围: 110x110mm", "coding,laser,traceability,printing", externalImage(5), 1],
  ];
  for (const row of productRows) {
    productStmt.run(...row, `${row[1]} | Packaging Machinery`, `${row[5]} Learn specifications, applications and request a quote.`);
  }

  sqlite.prepare("INSERT OR IGNORE INTO news_categories(name, slug) VALUES (?, ?)").run("Industry News", "industry-news");
  seedArticles(sqlite);
  seedSettings(sqlite);
}

function seedArticles(sqlite: Database.Database) {
  const product = sqlite.prepare("SELECT id, english_name FROM products ORDER BY id LIMIT 1").get() as { id: number; english_name: string };
  const sourceUrl = "https://example.com/open-industry-source/packaging-automation-market-note";
  const canonical = canonicalizeUrl(sourceUrl);
  const publishedAt = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const image = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80";
  const content = `<h2>Core Answer</h2><p>This is a clearly marked demonstration article for validating the News system. It is not presented as a real external news report.</p><h2>Source Facts</h2><p>The system stores source URL, canonical URL, publication time, fetch time, source fingerprint and product relationship for future RSS or News API integration.</p><h2>Our View</h2><p>Packaging machinery buyers care about stable automation, traceability and after-sales support. News content should connect industry changes to real product pages without copying original articles.</p><h2>How We Can Help</h2><p>${product.english_name} helps customers build reliable small-bag packaging workflows and can integrate with coding, sealing and conveying equipment.</p>`;
  sqlite.prepare(`INSERT OR IGNORE INTO news_articles
    (title, slug, excerpt, content, status, cover_image_url, cover_image_source_url, cover_image_page_url, cover_image_alt,
     author_name, category_id, published_at, seo_title, seo_description, canonical_url, primary_keyword, secondary_keywords,
     geo_summary, key_takeaways, source_title, source_author, source_publisher, source_url, canonical_source_url,
     source_language, source_published_at, source_fetched_at, source_timezone, source_fingerprint, event_fingerprint,
     content_hash, relevance_score, credibility_score, generation_model, generation_prompt_version)
    VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      "Packaging Automation News System Demonstration",
      "packaging-automation-news-system-demonstration",
      "A clearly marked demonstration article for validating News SEO, GEO, product linking and source fields.",
      content,
      image,
      "https://unsplash.com/",
      "https://unsplash.com/photos/person-using-machine",
      "Packaging automation line image from an external open image source",
      "Lianteng Editorial",
      publishedAt,
      "Packaging Automation News System Demonstration | Lianteng",
      "A non-factual demonstration News article used to verify source fields, product links, SEO, GEO and JSON-LD.",
      "/news/packaging-automation-news-system-demonstration",
      "packaging automation",
      "packaging machine,news automation,source traceability",
      "Demonstrates how source facts, analysis and related packaging machinery are exposed for AI search systems.",
      "Source traceability; product relationship; SEO metadata; JSON-LD; RSS and Sitemap coverage",
      "Packaging automation market note",
      "Example Source",
      "Example Public Source",
      sourceUrl,
      canonical,
      "en",
      publishedAt,
      new Date().toISOString(),
      "UTC",
      fingerprint([canonical, "Packaging automation market note", publishedAt]),
      fingerprint(["packaging automation", publishedAt.slice(0, 10)]),
      fingerprint([content]),
      0.8,
      0.5,
      "manual-demo",
      "v1",
    );
  const news = sqlite.prepare("SELECT id FROM news_articles WHERE slug = ?").get("packaging-automation-news-system-demonstration") as { id: number };
  sqlite.prepare("INSERT OR IGNORE INTO news_products(news_id, product_id, relevance_score, relationship_reason) VALUES (?, ?, ?, ?)").run(news.id, product.id, 0.8, "示例文章用于验证 News 与真实产品关联");

  const blogContent = `<h2>Overview</h2><p>This implementation note explains how overseas B2B packaging machinery websites can connect product pages, forms, News, Blog and SEO data.</p><h2>Key Takeaways</h2><ul><li>Published content should link to real products.</li><li>Forms must be stored server-side.</li><li>SEO and GEO fields should be part of the content model.</li></ul><h2>Related Product</h2><p>${product.english_name} is used as a real product relationship for validation.</p>`;
  sqlite.prepare(`INSERT OR IGNORE INTO blog_articles
    (title, slug, excerpt, content, status, cover_image_url, cover_image_source_url, cover_image_page_url, cover_image_alt,
     author_name, published_at, seo_title, seo_description, canonical_url, geo_summary, key_takeaways, source_url)
    VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    "How B2B Packaging Websites Connect Products, Content and Inquiries",
    "how-b2b-packaging-websites-connect-products-content-and-inquiries",
    "A practical implementation note for connecting product content, News, Blog, forms and SEO.",
    blogContent,
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
    "https://unsplash.com/",
    "https://unsplash.com/photos/people-sitting-down-near-table-with-assorted-laptop-computers",
    "Team reviewing B2B website content workflow",
    "Lianteng Editorial",
    publishedAt,
    "B2B Packaging Website Content and Inquiry System",
    "How product pages, News, Blog, inquiry forms, SEO and GEO connect on a B2B packaging machinery website.",
    "/blog/how-b2b-packaging-websites-connect-products-content-and-inquiries",
    "Explains how B2B packaging machinery content should expose product relationships, inquiry paths and SEO/GEO signals.",
    "Product linking; server-side forms; SEO/GEO; content operations",
    "internal-implementation-note",
  );
  const blog = sqlite.prepare("SELECT id FROM blog_articles WHERE slug = ?").get("how-b2b-packaging-websites-connect-products-content-and-inquiries") as { id: number };
  sqlite.prepare("INSERT OR IGNORE INTO blog_products(blog_id, product_id, relevance_score, relationship_reason) VALUES (?, ?, ?, ?)").run(blog.id, product.id, 0.75, "博客说明产品、内容和询盘系统之间的关系");
}

function seedSettings(sqlite: Database.Database) {
  const stmt = sqlite.prepare("INSERT OR IGNORE INTO system_settings(key, value) VALUES (?, ?)");
  for (const setting of [
    ["site_name", process.env.SITE_NAME || "Wenzhou Lianteng Packaging Machinery Co., LTD"],
    ["default_language", "en"],
    ["default_timezone", process.env.NEWS_TIMEZONE || "Asia/Shanghai"],
    ["news_daily_target", process.env.NEWS_DAILY_TARGET || "4"],
    ["news_auto_publish", process.env.NEWS_AUTO_PUBLISH || "false"],
    ["upload_max_mb", "20"],
    ["data_retention_days", "730"],
  ]) stmt.run(...setting);

  const sync = sqlite.prepare("INSERT OR IGNORE INTO sync_sources(name, source_type, configured, connection_status) VALUES (?, ?, ?, ?)");
  sync.run("Google Search Console", "seo", process.env.GSC_CLIENT_EMAIL ? 1 : 0, process.env.GSC_CLIENT_EMAIL ? "已配置" : "尚未配置");
  sync.run("News API", "news", process.env.NEWS_API_KEY ? 1 : 0, process.env.NEWS_API_KEY ? "已配置" : "尚未配置");
  sync.run("AI Provider", "ai", process.env.AI_PROVIDER_API_KEY ? 1 : 0, process.env.AI_PROVIDER_API_KEY ? "已配置" : "尚未配置");
}

function externalImage(index: number) {
  const images = [
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=1200&q=80",
  ];
  return images[index % images.length];
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 210_000, 32, "sha256").toString("hex");
  return `pbkdf2$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [method, salt, hash] = stored.split("$");
  if (method !== "pbkdf2" || !salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, 210_000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

export function products() {
  return db().prepare(`SELECT p.*, c.english_name as category_name FROM products p JOIN product_categories c ON c.id = p.category_id WHERE p.status = 'published' AND p.deleted_at IS NULL ORDER BY p.is_featured DESC, p.updated_at DESC`).all() as Product[];
}

export function productBySlug(slug: string) {
  return db().prepare(`SELECT p.*, c.english_name as category_name FROM products p JOIN product_categories c ON c.id = p.category_id WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`).get(slug) as Product | undefined;
}

export function articles(kind: "news" | "blog", limit = 20) {
  const table = kind === "news" ? "news_articles" : "blog_articles";
  return db().prepare(`SELECT * FROM ${table} WHERE status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC LIMIT ?`).all(limit) as Article[];
}

export function articleBySlug(kind: "news" | "blog", slug: string) {
  const table = kind === "news" ? "news_articles" : "blog_articles";
  return db().prepare(`SELECT * FROM ${table} WHERE slug = ? AND status = 'published' AND deleted_at IS NULL`).get(slug) as Article | undefined;
}

export function relatedProductsForArticle(kind: "news" | "blog", id: number) {
  const join = kind === "news" ? "news_products" : "blog_products";
  const idCol = kind === "news" ? "news_id" : "blog_id";
  return db().prepare(`SELECT p.*, c.english_name as category_name, j.relationship_reason, j.relevance_score
    FROM ${join} j JOIN products p ON p.id = j.product_id JOIN product_categories c ON c.id = p.category_id
    WHERE j.${idCol} = ? AND p.status = 'published' AND p.deleted_at IS NULL ORDER BY j.display_order ASC`).all(id) as Product[];
}

export function audit(action: string, module: string, result = "success", objectId?: string, after?: string) {
  db().prepare("INSERT INTO audit_logs(action, module, object_id, after_summary, result) VALUES (?, ?, ?, ?, ?)").run(action, module, objectId || null, after || null, result);
}
