"use client";

import { useState } from "react";
import { createClient } from "../../utils/supabase/client";

const supabase = createClient();
const API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY || "3478142e";

type MovieStatus = "watchlist" | "watched";

type Movie = {
  id: string;
  imdb_id?: string;
  title: string;
  year: number;
  poster: string;
  plot: string;
  rating?: number | null;
  status: MovieStatus;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [message, setMessage] = useState("");

  async function searchMovies(search: string) {
    const trimmed = search.trim();

    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    setMessage("");

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();

      if (!data.Search) {
        setSearchResults([]);
        return;
      }

      const movies: Movie[] = data.Search.map((movie: any) => ({
        id: movie.imdbID,
        imdb_id: movie.imdbID,
        title: movie.Title,
        year: Number.parseInt(movie.Year, 10) || 0,
        poster: movie.Poster !== "N/A" ? movie.Poster : "",
        plot: "Keine Beschreibung verfügbar",
        rating: null,
        status: "watchlist",
      }));

      setSearchResults(movies);
    } catch {
      setMessage("Suche fehlgeschlagen.");
    } finally {
      setLoadingSearch(false);
    }
  }

  async function addMovie(movie: Movie) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Bitte zuerst einloggen.");
      return;
    }

    const { data: existing } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("imdb_id", movie.imdb_id)
      .maybeSingle();

    if (existing) {
      setMessage("Film ist bereits in deiner Watchlist.");
      return;
    }

    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id,
      imdb_id: movie.imdb_id ?? null,
      title: movie.title,
      year: movie.year,
      poster: movie.poster,
      plot: movie.plot,
      rating: movie.rating ?? null,
      status: movie.status,
    });

    setMessage(error ? "Film konnte nicht gespeichert werden." : "Film hinzugefügt.");
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
        <h1 style={{ marginTop: 0 }}>Suche</h1>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Film suchen..."
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
            }}
          />
          <button onClick={() => searchMovies(query)}>Suchen</button>
        </div>

        {message ? <p>{message}</p> : null}
        {loadingSearch ? <p>Suche läuft...</p> : null}

        <div style={{ display: "grid", gap: 16 }}>
          {searchResults.map((movie) => (
            <div
              key={movie.id}
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "16px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{movie.title}</h3>
              <p>{movie.year}</p>
              <p>{movie.plot}</p>
              <button onClick={() => addMovie(movie)}>Zur Watchlist hinzufügen</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}