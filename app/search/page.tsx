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
  genres?: string[];
  runtime?: string;
  actors?: string;
  imdbRating?: string;
};

function MovieCard({
  movie,
  onAdd,
}: {
  movie: Movie;
  onAdd: (movie: Movie) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const longText = movie.plot && movie.plot.length > 140;
  const shortPlot =
    longText && !expanded ? `${movie.plot.slice(0, 140)}...` : movie.plot;

  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {movie.poster ? (
        <img
          src={movie.poster}
          alt={movie.title}
          style={{
            width: "100%",
            height: "320px",
            objectFit: "cover",
            background: "#e5e7eb",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "320px",
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
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: "18px" }}>
          {movie.title}
        </h3>

        <p style={{ color: "#64748b", marginTop: 0 }}>{movie.year}</p>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {(movie.genres || ["N/A"]).map((genre) => (
            <span
              key={genre}
              style={{
                background: "#e5e7eb",
                color: "#111827",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
              }}
            >
              {genre}
            </span>
          ))}
        </div>

        <div style={{ minHeight: "110px" }}>
          <p
            style={{
              color: "#334155",
              lineHeight: 1.5,
              marginBottom: "8px",
            }}
          >
            {shortPlot || "Keine Beschreibung verfügbar"}
          </p>

          {longText ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "transparent",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                padding: "6px 10px",
                borderRadius: "10px",
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              {expanded ? "Weniger anzeigen" : "Mehr lesen"}
            </button>
          ) : (
            <div style={{ height: "36px", marginBottom: "12px" }} />
          )}
        </div>

        <div
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginBottom: "12px",
          }}
        >
          {movie.runtime ? <p style={{ margin: "4px 0" }}>⏱ {movie.runtime}</p> : null}
          {movie.imdbRating ? (
            <p style={{ margin: "4px 0" }}>⭐ IMDb {movie.imdbRating}</p>
          ) : null}
          {movie.actors ? <p style={{ margin: "4px 0" }}>🎭 {movie.actors}</p> : null}
        </div>

        <div style={{ marginTop: "auto" }}>
          <button onClick={() => onAdd(movie)}>Zur Watchlist hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

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
        setMessage("Keine Ergebnisse gefunden.");
        return;
      }

      const detailedMovies = await Promise.all(
        data.Search.slice(0, 8).map(async (movie: any) => {
          try {
            const detailRes = await fetch(
              `https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}&plot=short`
            );
            const detail = await detailRes.json();

            return {
              id: movie.imdbID,
              imdb_id: movie.imdbID,
              title: detail.Title || movie.Title,
              year: Number.parseInt(detail.Year, 10) || 0,
              poster: detail.Poster && detail.Poster !== "N/A" ? detail.Poster : "",
              plot:
                detail.Plot && detail.Plot !== "N/A"
                  ? detail.Plot
                  : "Keine Beschreibung verfügbar",
              rating: null,
              status: "watchlist" as MovieStatus,
              genres:
                detail.Genre && detail.Genre !== "N/A"
                  ? detail.Genre.split(",").map((g: string) => g.trim())
                  : ["N/A"],
              runtime: detail.Runtime && detail.Runtime !== "N/A" ? detail.Runtime : "",
              actors: detail.Actors && detail.Actors !== "N/A" ? detail.Actors : "",
              imdbRating:
                detail.imdbRating && detail.imdbRating !== "N/A"
                  ? detail.imdbRating
                  : "",
            } satisfies Movie;
          } catch {
            return {
              id: movie.imdbID,
              imdb_id: movie.imdbID,
              title: movie.Title,
              year: Number.parseInt(movie.Year, 10) || 0,
              poster: movie.Poster !== "N/A" ? movie.Poster : "",
              plot: "Keine Beschreibung verfügbar",
              rating: null,
              status: "watchlist" as MovieStatus,
              genres: ["N/A"],
              runtime: "",
              actors: "",
              imdbRating: "",
            } satisfies Movie;
          }
        })
      );

      setSearchResults(detailedMovies);
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
        <h1 style={{ marginTop: 0, fontSize: "56px", lineHeight: 1 }}>Suche</h1>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Film suchen..."
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid #d1d5db",
              fontSize: "16px",
            }}
          />
          <button onClick={() => searchMovies(query)}>Suchen</button>
        </div>

        {message ? <p>{message}</p> : null}
        {loadingSearch ? <p>Suche läuft...</p> : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "18px",
          }}
        >
          {searchResults.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onAdd={addMovie} />
          ))}
        </div>
      </section>
    </main>
  );
}