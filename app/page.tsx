export default function HomePage() {
  return (
    <main style={{ padding: "16px" }}>
      
      {/* 🔵 HEADER (kein full screen mehr!) */}
      <section
        style={{
          background: "#2563eb",
          color: "white",
          padding: "20px",
          borderRadius: "20px",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
          FilmApp
        </h1>

        <p style={{ fontSize: "14px", opacity: 0.9 }}>
          Verwalte deine Watchlist und entdecke neue Filme
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "16px",
            flexWrap: "wrap",
          }}
        >
          <a href="/search">
            <button>🔍 Suchen</button>
          </a>

          <a href="/watchlist">
            <button>🎬 Watchlist</button>
          </a>
        </div>
      </section>

      {/* 📊 STATS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "16px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Filme
          </p>
          <h2>0</h2>
        </div>

        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "16px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Gesehen
          </p>
          <h2>0</h2>
        </div>
      </section>

    </main>
  );
}