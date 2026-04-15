import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FilmApp",
  description: "Persönliche Filmverwaltung",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-brand">FilmApp</div>

            <nav className="sidebar-nav">
              <Link href="/">Startseite</Link>
              <Link href="/watchlist">Watchlist</Link>
              <Link href="/search">Suche</Link>
            </nav>
          </aside>

          <main className="page-content">{children}</main>
        </div>
      </body>
    </html>
  );
}