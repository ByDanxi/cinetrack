export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <aside className="sidebar">
        <h2>FilmApp</h2>
        <nav>
          <a href="/">Startseite</a>
          <a href="/watchlist">Watchlist</a>
          <a href="/search">Suche</a>
        </nav>
      </aside>

      <main>{children}</main>
    </>
  );
}