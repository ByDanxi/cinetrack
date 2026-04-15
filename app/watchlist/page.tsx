"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

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
};

function MovieCard({
  movie,
  onDelete,
  onToggleWatched,
  onRate,
}: {
  movie: Movie;
  onDelete: (id: string) => void;
  onToggleWatched: (id: string) => void;
  onRate: (id: string, rating: number) => void;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: "18px",
      }}
    >
      {movie.poster ? (
        <img
          src={movie.poster}
          alt={movie.title}
          style={{
            width: "220px",
            height: "330px",
            objectFit: "cover",
            background: "#e5e7eb",
          }}
        />
      ) : (
        <div
          style={{
            width: "220px",
            height: "330px",
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
          }}
        >
          Kein Poster
        </div>
      )}

      <div
        style={{
          padding: "18px 18px 18px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: "28px" }}>
          {movie.title}
        </h3>

        <p style={{ color: "#64748b", marginTop: 0, marginBottom: 12 }}>
          {movie.year}
        </p>

        <p style={{ marginBottom: 14 }}>
          Status:{" "}
          <strong>{movie.status === "watched" ? "Gesehen" : "Watchlist"}</strong>
        </p>

        {movie.rating != null ? (
          <p style={{ marginBottom: 14 }}>Bewertung: {movie.rating}/10</p>
        ) : (
          <p style={{ marginBottom: 14 }}>Bewertung: —</p>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <button onClick={() => onToggleWatched(movie.id)}>
            {movie.status === "watched" ? "Zur Watchlist" : "Als gesehen"}
          </button>
          <button onClick={() => onDelete(movie.id)}>Löschen</button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button key={n} onClick={() => onRate(movie.id, n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMovies() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setWatchlist((data || []) as Movie[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMovies();
  }, []);

  async function deleteMovie(id: string) {
    const { error } = await supabase.from("watchlist").delete().eq("id", id);

    if (!error) {
      setWatchlist((prev) => prev.filter((movie) => movie.id !== id));
    }
  }

  async function toggleWatched(id: string) {
    const movie = watchlist.find((m) => m.id === id);
    if (!movie) return;

    const newStatus: MovieStatus =
      movie.status === "watched" ? "watchlist" : "watched";

    const { error } = await supabase
      .from("watchlist")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setWatchlist((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
    }
  }

  async function rateMovie(id: string, rating: number) {
    const { error } = await supabase
      .from("watchlist")
      .update({ rating })
      .eq("id", id);

    if (!error) {
      setWatchlist((prev) =>
        prev.map((m) => (m.id === id ? { ...m, rating } : m))
      );
    }
  }

  return (
    <main
      style={{
        background: "#f3f4f6",
        minHeight: "100vh",
        padding: "16px",
      }}
    >
      <section
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "20px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Watchlist</h1>

        {loading ? <p>Lädt...</p> : null}
        {!loading && watchlist.length === 0 ? (
          <p>Noch keine Filme gespeichert.</p>
        ) : null}

        <div style={{ display: "grid", gap: 16 }}>
          {watchlist.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onDelete={deleteMovie}
              onToggleWatched={toggleWatched}
              onRate={rateMovie}
            />
          ))}
        </div>
      </section>
    </main>
  );
}