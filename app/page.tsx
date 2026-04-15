export default function HomePage() {
  return (
    <main
      style={{
        background: "#f3f4f6",
        minHeight: "100vh",
        padding: "16px",
      }}
    >
      <div
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
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Filme</p>
          <h2 style={{ marginTop: "8px" }}>0</h2>
        </div>

        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "16px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Gesehen</p>
          <h2 style={{ marginTop: "8px" }}>0</h2>
        </div>
      </div>
    </main>
  );
}