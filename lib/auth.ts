import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { db, verifyPassword, audit } from "./db";

const COOKIE_NAME = "ltpk_admin_session";

export async function login(email: string, password: string) {
  const sqlite = db();
  const ip = (await headers()).get("x-forwarded-for") || "local";
  const failures = sqlite
    .prepare("SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND success = 0 AND created_at > datetime('now', '-15 minutes')")
    .get(email) as { count: number };
  if (failures.count >= 5) {
    audit("登录失败锁定", "用户与权限", "failed", email, "15分钟内失败次数过多");
    return { ok: false, message: "登录失败次数过多，请稍后再试。" };
  }

  const user = sqlite.prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL").get(email) as
    | { id: number; email: string; password_hash: string; role: string }
    | undefined;
  const success = Boolean(user && verifyPassword(password, user.password_hash));
  sqlite.prepare("INSERT INTO login_attempts(email, ip, success) VALUES (?, ?, ?)").run(email, ip, success ? 1 : 0);
  if (!success || !user) {
    audit("登录失败", "用户与权限", "failed", email);
    return { ok: false, message: "账号或密码不正确。" };
  }

  const sessionId = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString();
  sqlite.prepare("INSERT INTO sessions(id, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)").run(
    sessionId,
    user.id,
    expires,
    ip,
    (await headers()).get("user-agent") || "",
  );
  (await cookies()).set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
  audit("用户登录", "用户与权限", "success", String(user.id));
  return { ok: true, message: "登录成功" };
}

export async function logout() {
  const jar = await cookies();
  const session = jar.get(COOKIE_NAME)?.value;
  if (session) db().prepare("DELETE FROM sessions WHERE id = ?").run(session);
  jar.delete(COOKIE_NAME);
  audit("用户退出", "用户与权限");
}

export async function currentUser() {
  const session = (await cookies()).get(COOKIE_NAME)?.value;
  if (!session) return null;
  const row = db()
    .prepare(`SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > datetime('now')`)
    .get(session) as { id: number; email: string; name: string; role: string } | undefined;
  return row || null;
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new Error("未登录或会话已过期");
  return user;
}

