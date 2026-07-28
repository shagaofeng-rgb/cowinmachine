import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Wenzhou Lianteng Packaging Machinery Co., LTD",
    template: "%s | Lianteng Packaging Machinery",
  },
  description: "B2B packaging machinery, sealing machines, coding machines and automated packaging solutions.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header">
          <a className="brand" href="/" aria-label="Lianteng Packaging home">
            <img className="brand-logo" src="/brand/cowin-logo.jpg" alt="" width="64" height="64" />
            <span className="brand-name">Lianteng Packaging</span>
          </a>
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
          <span>No.405-1 Xia Jin Road, Jinzhu Industrial Zone, South White Elephant, Ouhai District, Wenzhou City, Zhejiang Province, China</span>
          <a href="tel:+8657788309030">(86)-0577-88309030</a>
          <a href="mailto:lianteng@31819.com">lianteng@31819.com</a>
        </footer>
      </body>
    </html>
  );
}
