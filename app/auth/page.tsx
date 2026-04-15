"use client";

import { useState } from "react";
import { createClient } from "../../utils/supabase/client";

export default function AuthPage() {
  const supabase = createClient();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        window.location.href = "/";
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Konto erstellt. Du kannst dich jetzt einloggen.");
      setIsLogin(true);
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="container">
        <section className="section" style={{ maxWidth: 460, margin: "0 auto" }}>
          <h1>{isLogin ? "Login" : "Registrieren"}</h1>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: 12, marginTop: 20 }}
          >
            {!isLogin && (
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Benutzername"
                required
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              required
            />

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? "Lädt..." : isLogin ? "Einloggen" : "Konto erstellen"}
            </button>
          </form>

          {message ? (
            <p className="muted" style={{ marginTop: 12 }}>
              {message}
            </p>
          ) : null}

          <button
            className="secondary-btn"
            style={{ marginTop: 16 }}
            onClick={() => {
              setIsLogin((v) => !v);
              setMessage("");
            }}
          >
            {isLogin ? "Noch kein Konto? Registrieren" : "Schon ein Konto? Login"}
          </button>
        </section>
      </div>
    </main>
  );
}