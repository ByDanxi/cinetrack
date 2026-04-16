export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          minHeight: "100vh",
          background: "#0b1020",
          color: "#fff",
          padding: "20px 16px",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>FilmApp</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a href="/" style={{ color: "#fff", textDecoration: "none" }}>
            Startseite
          </a>
          <a href="/watchlist" style={{ color: "#fff", textDecoration: "none" }}>
            Watchlist
          </a>
          <a href="/search" style={{ color: "#fff", textDecoration: "none" }}>
            Suche
          </a>
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}