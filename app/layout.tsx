import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Wenzhou Lianteng Packaging Machinery Co., LTD",
    template: "%s | Lianteng Packaging Machinery",
  },
  description: "B2B packaging machinery, sealing machines, coding machines and automated packaging solutions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header">
          <a className="brand" href="/">Lianteng Packaging</a>
          <nav aria-label="Main navigation">
            <a href="/products">Products</a>
            <a href="/news">News</a>
            <a href="/blog">Blog</a>
            <a href="/search">Search</a>
            <a href="/contact">Contact</a>
            <a href="/admin">中文后台</a>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="footer">
          <strong>Wenzhou Lianteng Packaging Machinery Co., LTD</strong>
          <span>No.405-1 Xia Jin Road, Wenzhou, Zhejiang, China</span>
          <a href="mailto:lianteng@31819.com">lianteng@31819.com</a>
        </footer>
      </body>
    </html>
  );
}
