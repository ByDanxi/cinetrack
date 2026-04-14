"use client";

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>iPad Touch Test 2</h1>
      <p>Zähler: {count}</p>

      <div style={{ display: "grid", gap: 16, maxWidth: 420 }}>
        <input
          type="button"
          value="Input Button"
          onClick={() => setCount((c) => c + 1)}
          style={{
            padding: "16px 24px",
            fontSize: 18,
            borderRadius: 12,
            border: "1px solid black",
            background: "red",
            color: "white",
          }}
        />

        <label
          style={{
            display: "block",
            padding: "16px 24px",
            fontSize: 18,
            borderRadius: 12,
            border: "1px solid black",
            background: "blue",
            color: "white",
            textAlign: "center",
            userSelect: "none",
          }}
        >
          Label mit Checkbox
          <input
            type="checkbox"
            style={{ display: "none" }}
            onChange={() => setCount((c) => c + 1)}
          />
        </label>

        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          style={{
            padding: "16px 24px",
            fontSize: 18,
            borderRadius: 12,
            border: "1px solid black",
            background: "green",
            color: "white",
          }}
        >
          HTML Button
        </button>
      </div>
    </main>
  );
}