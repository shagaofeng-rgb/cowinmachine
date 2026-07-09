import { currentUser } from "@/lib/auth";
import { articles, db, products } from "@/lib/db";
import { googleSeoConfig, sitemapUrl } from "@/lib/google-seo";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <section className="section">
        <h1>中文管理后台</h1>
        <p>请先登录。若尚未创建管理员，请配置 ADMIN_EMAIL 和 ADMIN_INITIAL_PASSWORD 后运行 db:init。</p>
        <a className="button" href="/admin/login">进入登录</a>
      </section>
    );
  }
  const sqlite = db();
  const forms = sqlite.prepare("SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 20").all() as Array<Record<string, string>>;
  const jobs = sqlite.prepare("SELECT * FROM news_jobs ORDER BY scheduled_at DESC LIMIT 10").all() as Array<Record<string, string>>;
  const audits = sqlite.prepare("SELECT * FROM news_publication_audits ORDER BY checked_at DESC LIMIT 10").all() as Array<Record<string, string | number>>;
  const sync = sqlite.prepare("SELECT * FROM sync_sources ORDER BY id").all() as Array<Record<string, string | number>>;
  const seoJobs = sqlite.prepare("SELECT * FROM sync_jobs WHERE source_name = 'Google Search Console' ORDER BY started_at DESC LIMIT 8").all() as Array<Record<string, string | number>>;
  const seoConfig = googleSeoConfig();
  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <strong>管理后台</strong>
        <a href="#dashboard">数据概览</a>
        <a href="#products">产品管理</a>
        <a href="#news">新闻管理</a>
        <a href="#forms">客户表单</a>
        <a href="#sync">数据同步</a>
        <a href="#logs">任务日志</a>
        <form action="/api/admin/logout" method="post"><button className="button secondary">退出登录</button></form>
      </aside>
      <main className="admin-main">
        <h1>数据概览</h1>
        <p className="meta">当前用户：{user.name} / {user.role}</p>
        <section id="dashboard" className="grid">
          <div className="card"><div className="card-body"><h3>产品数量</h3><p>{products().length}</p></div></div>
          <div className="card"><div className="card-body"><h3>News 数量</h3><p>{articles("news").length}</p></div></div>
          <div className="card"><div className="card-body"><h3>Blog 数量</h3><p>{articles("blog").length}</p></div></div>
        </section>
        <section id="products"><h2>产品管理</h2><DataTable rows={products()} columns={["id", "english_name", "sku", "status", "category_name"]} /></section>
        <section id="news"><h2>新闻管理</h2><form action="/api/admin/news/run" method="post"><button className="button">手动执行 News 自动发布</button></form><DataTable rows={articles("news")} columns={["id", "title", "status", "source_publisher", "published_at"]} /></section>
        <section id="forms"><h2>客户表单</h2><DataTable rows={forms} columns={["form_no", "name", "email", "country", "status", "created_at"]} /></section>
        <section id="sync">
          <h2>数据同步</h2>
          <div className="card">
            <div className="card-body">
              <h3>Google SEO / Search Console</h3>
              <p className="meta">站点属性：{seoConfig.siteUrl} · Sitemap：{sitemapUrl()} · 服务账号：{seoConfig.clientEmail || "未配置"}</p>
              <form action="/api/admin/google-seo/sync" method="post">
                <button className="button">同步 Google SEO</button>
              </form>
            </div>
          </div>
          <DataTable rows={sync} columns={["name", "source_type", "configured", "connection_status", "last_success_at", "recent_error"]} />
          <h3>Google SEO 同步记录</h3>
          <DataTable rows={seoJobs} columns={["id", "status", "started_at", "completed_at", "success_count", "failure_count", "error_message"]} />
        </section>
        <section id="logs"><h2>News 任务与每日审计</h2><DataTable rows={jobs} columns={["id", "job_type", "status", "retry_count", "error_message"]} /><DataTable rows={audits} columns={["date", "target_count", "published_count", "missing_count", "status"]} /></section>
      </main>
    </div>
  );
}

function DataTable({ rows, columns }: { rows: Array<Record<string, unknown>>; columns: string[] }) {
  if (!rows.length) return <p>暂无数据</p>;
  return <table className="table"><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{columns.map((c) => <td key={c}>{String(row[c] ?? "")}</td>)}</tr>)}</tbody></table>;
}
