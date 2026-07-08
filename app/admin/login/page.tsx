export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <section className="section">
      <div className="content">
        <h1>中文管理后台登录</h1>
        <p>初始管理员通过环境变量 ADMIN_EMAIL 和 ADMIN_INITIAL_PASSWORD 创建。首次生产部署请立即修改密码。</p>
        {searchParams?.error && <p role="alert" style={{ color: "#b42318" }}>{searchParams.error}</p>}
        <form className="form" action="/api/admin/login" method="post">
          <label>账号<input required type="email" name="email" autoComplete="username" /></label>
          <label>密码<input required type="password" name="password" autoComplete="current-password" /></label>
          <label><span><input type="checkbox" name="remember" value="1" /> 记住登录状态</span></label>
          <button className="button">登录</button>
        </form>
      </div>
    </section>
  );
}
