"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "../utils/supabase/client";

const supabase = createClient();
const API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY || "3478142e";

type MovieStatus = "watchlist" | "watched";

type Movie = {
  id: string;
  user_id?: string;
  imdb_id?: string;
  title: string;
  year: number;
  poster: string;
  plot: string;
  rating?: number | null;
  status: MovieStatus;
  created_at?: string;
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
    <div className="movie-card">
      {movie.poster ? (
        <img
          src={movie.poster}
          alt={movie.title}
          style={{
            width: "100%",
            maxWidth: 220,
            borderRadius: 12,
            marginBottom: 12,
            display: "block",
          }}
        />
      ) : null}

      <h3>{movie.title}</h3>
      <p style={{ marginTop: 6, opacity: 0.8 }}>{movie.year}</p>

      {movie.plot ? (
        <p style={{ marginTop: 10, opacity: 0.9 }}>{movie.plot}</p>
      ) : null}

      <div className="button-group">
        <button onClick={() => onToggleWatched(movie.id)}>
          {movie.status === "watched" ? "Zur Watchlist" : "Als gesehen"}
        </button>

        <button onClick={() => onDelete(movie.id)}>Löschen</button>
      </div>

      <div className="button-group rating" style={{ marginTop: 12 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button key={n} onClick={() => onRate(movie.id, n)}>
            {n}
          </button>
        ))}
      </div>

      {movie.rating != null ? (
        <p style={{ marginTop: 10 }}>{movie.rating}/10</p>
      ) : null}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const watchedMovies = useMemo(
    () => watchlist.filter((movie) => movie.status === "watched"),
    [watchlist]
  );

  const progress =
    watchlist.length > 0
      ? Math.round((watchedMovies.length / watchlist.length) * 100)
      : 0;

  async function ensureUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth";
      return null;
    }

    setUserEmail(user.email ?? "");
    return user;
  }

  async function loadMovies() {
    const user = await ensureUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden:", error.message);
      return;
    }

    const mapped: Movie[] = (data || []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      imdb_id: item.imdb_id,
      title: item.title,
      year: item.year,
      poster: item.poster || "",
      plot: item.plot || "Keine Beschreibung verfügbar",
      rating: item.rating,
      status: (item.status as MovieStatus) || "watchlist",
      created_at: item.created_at,
    }));

    setWatchlist(mapped);
  }

  useEffect(() => {
    async function init() {
      setLoadingPage(true);
      await loadMovies();
      setLoadingPage(false);
    }

    init();
  }, []);

  async function searchMovies(search: string) {
    const trimmed = search.trim();

    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
          trimmed
        )}`
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
        status: "watchlist" as MovieStatus,
      }));

      setSearchResults(movies);
    } catch (error) {
      console.error("Fehler bei der Suche:", error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }

  async function addMovie(movie: Movie) {
    const user = await ensureUser();
    if (!user) return;

    const alreadyExists = watchlist.some(
      (m) => m.imdb_id && movie.imdb_id && m.imdb_id === movie.imdb_id
    );

    if (alreadyExists) return;

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

    if (error) {
      console.error("Fehler beim Hinzufügen:", error.message);
      return;
    }

    await loadMovies();
  }

  async function deleteMovie(id: string) {
    const { error } = await supabase.from("watchlist").delete().eq("id", id);

    if (error) {
      console.error("Fehler beim Löschen:", error.message);
      return;
    }

    setWatchlist((prev) => prev.filter((movie) => movie.id !== id));
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

    if (error) {
      console.error("Fehler beim Statuswechsel:", error.message);
      return;
    }

    setWatchlist((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
  }

  async function rateMovie(id: string, rating: number) {
    const { error } = await supabase
      .from("watchlist")
      .update({ rating })
      .eq("id", id);

    if (error) {
      console.error("Fehler beim Bewerten:", error.message);
      return;
    }

    setWatchlist((prev) =>
      prev.map((m) => (m.id === id ? { ...m, rating } : m))
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  if (loadingPage) {
    return (
      <main style={{ padding: "20px" }}>
        <h1>CineTrack</h1>
        <p>Lädt...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <h1 style={{ marginBottom: 0 }}>CineTrack</h1>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {userEmail ? <span style={{ opacity: 0.8 }}>{userEmail}</span> : null}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div
        className="movie-card"
        style={{
          marginBottom: 24,
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
        }}
      >
        <div>
          <input
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              searchMovies(value);
            }}
            placeholder="Film suchen..."
          />
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div className="movie-card" style={{ marginBottom: 0 }}>
            <strong>Filme</strong>
            <p style={{ marginTop: 8 }}>{watchlist.length}</p>
          </div>

          <div className="movie-card" style={{ marginBottom: 0 }}>
            <strong>Gesehen</strong>
            <p style={{ marginTop: 8 }}>{watchedMovies.length}</p>
          </div>

          <div className="movie-card" style={{ marginBottom: 0 }}>
            <strong>Fortschritt</strong>
            <p style={{ marginTop: 8 }}>{progress}%</p>
          </div>
        </div>
      </div>

      <h2>Suchergebnisse</h2>

      {loadingSearch ? <p>Suche läuft...</p> : null}

      {!loadingSearch &&
        searchResults.map((movie) => {
          const exists = watchlist.some(
            (m) => m.imdb_id && movie.imdb_id && m.imdb_id === movie.imdb_id
          );

          return (
            <div key={movie.id} className="search-item">
              <div>
                <p style={{ fontWeight: 600 }}>{movie.title}</p>
                <p style={{ opacity: 0.8 }}>{movie.year}</p>
              </div>

              <button onClick={() => addMovie(movie)} disabled={exists}>
                {exists ? "Schon drin" : "+"}
              </button>
            </div>
          );
        })}

      {!loadingSearch && query.trim() && searchResults.length === 0 ? (
        <p>Keine Ergebnisse gefunden.</p>
      ) : null}

      <h2>Watchlist</h2>

      {watchlist.length === 0 ? <p>Noch keine Filme gespeichert.</p> : null}

      {watchlist.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onDelete={deleteMovie}
          onToggleWatched={toggleWatched}
          onRate={rateMovie}
        />
      ))}
    </main>
  );
}