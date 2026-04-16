export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">FilmApp</div>

        <nav className="sidebar-nav">
          <a href="/">Startseite</a>
          <a href="/watchlist">Watchlist</a>
          <a href="/search">Suche</a>
        </nav>
      </aside>

      <main className="page-content">{children}</main>
    </div>
  );
}