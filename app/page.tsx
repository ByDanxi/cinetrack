"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../utils/supabase/client";

const supabase = createClient();

type MovieStatus = "watchlist" | "watched";

type Movie = {
  id: string;
  title: string;
  year: number;
  poster: string;
  plot: string;
  rating?: number | null;
  status: MovieStatus;
  imdb_id?: string;
  user_id?: string;
  watchlist_id: string;
};

export default function HomePage() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const watchedMovies = useMemo(
    () => watchlist.filter((movie) => movie.status === "watched"),
    [watchlist]
  );

  const progress =
    watchlist.length > 0
      ? Math.round((watchedMovies.length / watchlist.length) * 100)
      : 0;

  useEffect(() => {
    async function loadMovies() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("user_id", user.id);

      if (!error) {
        setWatchlist((data || []) as Movie[]);
      }

      setLoading(false);
    }

    loadMovies();
  }, []);

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
          <h2 style={{ marginTop: "8px" }}>{loading ? "..." : watchlist.length}</h2>
        </div>

        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "16px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Gesehen</p>
          <h2 style={{ marginTop: "8px" }}>
            {loading ? "..." : watchedMovies.length}
          </h2>
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "16px",
          borderRadius: "16px",
          marginTop: "12px",
        }}
      >
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Fortschritt</p>
        <div
          style={{
            width: "100%",
            height: "10px",
            background: "#e5e7eb",
            borderRadius: "999px",
            marginTop: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#0f172a",
              borderRadius: "999px",
            }}
          />
        </div>
        <p style={{ marginTop: "8px" }}>{loading ? "..." : `${progress}%`}</p>
      </div>
    </main>
  );
}