"use client";

import Link from "next/link";

export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="admin-main" lang="zh-CN">
    <section className="admin-empty">
      <h1>暂时无法读取后台数据</h1>
      <p>请重试，或稍后返回。此提示不代表数据已丢失。</p>
      <div className="cta-row"><button type="button" className="button button-primary" onClick={retry}>重试</button><Link href="/internal/admin" className="button button-outline">后台总览</Link></div>
    </section>
  </main>;
}
