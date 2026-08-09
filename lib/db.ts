import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import ltpkCatalog from "../data/ltpk-catalog.json";

const defaultDbPath = process.env.VERCEL ? "/tmp/site.db" : path.join(process.cwd(), "data", "site.db");
const dbPath = process.env.DATABASE_PATH || defaultDbPath;
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

type LtpkCatalog = {
  categories: Array<{ slug: string; name: string; summary: string }>;
  products: Array<{
    name: string;
    english_name: string;
    sku: string;
    slug: string;
    category_slug: string;
    summary: string;
    description: string;
    applications: string;
    features: string;
    specifications: string;
    tags: string;
    image_url: string;
    source_url: string;
    is_featured: number;
    seo_title: string;
    seo_description: string;
  }>;
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
    CREATE TABLE IF NOT EXISTS sitemap_runs (
      id TEXT PRIMARY KEY,
      trigger_type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_ms INTEGER,
      sitemap_files TEXT NOT NULL DEFAULT '[]',
      url_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      file_size_bytes INTEGER NOT NULL DEFAULT 0,
      split INTEGER NOT NULL DEFAULT 0,
      submitted_to_google INTEGER NOT NULL DEFAULT 0,
      google_result TEXT,
      diff_summary TEXT NOT NULL DEFAULT '{}',
      error_message TEXT
    );
    CREATE TABLE IF NOT EXISTS sitemap_locks (
      lock_name TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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

  seedLtpkCatalog(sqlite);
  seedSettings(sqlite);
}

function seedLtpkCatalog(sqlite: Database.Database) {
  const catalog = ltpkCatalog as LtpkCatalog;
  const catalogUpdatedAt = "2026-07-09T00:00:00.000Z";
  const categoryStmt = sqlite.prepare(`INSERT INTO product_categories
    (name, english_name, slug, summary, description, image_url, sort_order, seo_title, seo_description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      english_name = excluded.english_name,
      summary = excluded.summary,
      description = excluded.description,
      image_url = excluded.image_url,
      sort_order = excluded.sort_order,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      updated_at = excluded.updated_at`);
  const categoryImage = new Map<string, string>();
  for (const product of catalog.products) {
    if (!categoryImage.has(product.category_slug)) categoryImage.set(product.category_slug, product.image_url);
  }
  catalog.categories.forEach((category, index) => {
    categoryStmt.run(
      category.name,
      category.name,
      category.slug,
      category.summary,
      `${category.summary} This catalog section is migrated from the original LTPK website and optimized for B2B inquiries.`,
      categoryImage.get(category.slug) || "https://www.ltpk.com/uploads/2508/prpoducts-banner.jpg",
      index,
      `${category.name} | Lianteng Packaging Machinery`,
      category.summary,
      catalogUpdatedAt,
      catalogUpdatedAt,
    );
  });

  const categoryRows = sqlite.prepare("SELECT id, slug FROM product_categories").all() as Array<{ id: number; slug: string }>;
  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));
  const productStmt = sqlite.prepare(`INSERT INTO products
    (name, english_name, sku, slug, category_id, summary, description, applications, features, specifications, tags, image_url, is_featured, seo_title, seo_description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      english_name = excluded.english_name,
      sku = excluded.sku,
      category_id = excluded.category_id,
      summary = excluded.summary,
      description = excluded.description,
      applications = excluded.applications,
      features = excluded.features,
      specifications = excluded.specifications,
      tags = excluded.tags,
      image_url = excluded.image_url,
      status = 'published',
      is_featured = excluded.is_featured,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      updated_at = excluded.updated_at`);
  for (const product of catalog.products) {
    const categoryId = categoryIds.get(product.category_slug);
    if (!categoryId) continue;
    const sku = uniqueSku(sqlite, product.sku, product.slug);
    productStmt.run(
      product.name,
      product.english_name,
      sku,
      product.slug,
      categoryId,
      product.summary,
      product.description,
      product.applications,
      product.features,
      product.specifications,
      product.tags,
      product.image_url,
      product.is_featured,
      product.seo_title,
      product.seo_description,
      catalogUpdatedAt,
      catalogUpdatedAt,
    );
  }

  sqlite.prepare("UPDATE products SET status = 'archived' WHERE slug = ?").run("lt-320k-granule-packing-machine");
  sqlite
    .prepare("INSERT OR REPLACE INTO system_settings(key, value, updated_at) VALUES ('catalog_source', ?, CURRENT_TIMESTAMP)")
    .run("ltpk.com migrated catalog: 183 products / 36 categories");
}

function uniqueSku(sqlite: Database.Database, sku: string, slug: string) {
  const conflict = sqlite.prepare("SELECT slug FROM products WHERE sku = ? AND slug <> ?").get(sku, slug) as { slug: string } | undefined;
  if (!conflict) return sku;
  return `${sku.slice(0, 48)}-${slug.slice(0, 10)}`.slice(0, 64);
}

function seedSettings(sqlite: Database.Database) {
  const stmt = sqlite.prepare("INSERT OR IGNORE INTO system_settings(key, value) VALUES (?, ?)");
  for (const setting of [
    ["site_name", process.env.SITE_NAME || "Wenzhou Lianteng Packaging Machinery Co., LTD"],
    ["default_language", "en"],
    ["default_timezone", "Asia/Shanghai"],
    ["upload_max_mb", "20"],
    ["data_retention_days", "730"],
  ]) stmt.run(...setting);

  const sync = sqlite.prepare("INSERT OR IGNORE INTO sync_sources(name, source_type, configured, connection_status) VALUES (?, ?, ?, ?)");
  sync.run("Google Search Console", "seo", process.env.GSC_CLIENT_EMAIL ? 1 : 0, process.env.GSC_CLIENT_EMAIL ? "已配置" : "尚未配置");
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

export function productCategories() {
  return db()
    .prepare(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM product_categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.status = 'published' AND p.deleted_at IS NULL
       WHERE c.enabled = 1 AND c.deleted_at IS NULL
       GROUP BY c.id
       HAVING product_count > 0
       ORDER BY c.sort_order ASC, c.english_name ASC`,
    )
    .all() as Array<{ id: number; name: string; english_name: string; slug: string; summary: string; image_url: string; product_count: number; updated_at: string }>;
}

export function productCategoryBySlug(slug: string) {
  return db()
    .prepare(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM product_categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.status = 'published' AND p.deleted_at IS NULL
       WHERE c.slug = ? AND c.enabled = 1 AND c.deleted_at IS NULL
       GROUP BY c.id
       HAVING product_count > 0`,
    )
    .get(slug) as
    | { id: number; name: string; english_name: string; slug: string; summary: string; description: string; image_url: string; product_count: number; updated_at: string }
    | undefined;
}

export function productsByCategorySlug(slug: string) {
  return db()
    .prepare(
      `SELECT p.*, c.english_name as category_name
       FROM products p
       JOIN product_categories c ON c.id = p.category_id
       WHERE c.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL
       ORDER BY p.is_featured DESC, p.updated_at DESC, p.english_name ASC`,
    )
    .all(slug) as Product[];
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
