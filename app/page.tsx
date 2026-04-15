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
    <div className="watchlist-card">
      <div className="watchlist-poster-wrap">
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} className="watchlist-poster" />
        ) : (
          <div className="watchlist-poster-fallback">Kein Poster</div>
        )}
      </div>

      <div className="watchlist-content">
        <div className="watchlist-top">
          <div>
            <h3 className="watchlist-title">{movie.title}</h3>
            <p className="watchlist-year">{movie.year}</p>
          </div>

          <span
            className={
              movie.status === "watched"
                ? "status-badge status-badge-watched"
                : "status-badge status-badge-watchlist"
            }
          >
            {movie.status === "watched" ? "Gesehen" : "Watchlist"}
          </span>
        </div>

        <p className="watchlist-plot">
          {movie.plot || "Keine Beschreibung verfügbar"}
        </p>

        <div className="watchlist-actions">
          <button onClick={() => onToggleWatched(movie.id)}>
            {movie.status === "watched" ? "Zur Watchlist" : "Als gesehen"}
          </button>

          <button className="danger-btn" onClick={() => onDelete(movie.id)}>
            Löschen
          </button>
        </div>

        <div className="rating-row">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              className={movie.rating === n ? "rating-pill active" : "rating-pill"}
              onClick={() => onRate(movie.id, n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

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
      console.error(error.message);
      return;
    }

    setWatchlist((data || []) as Movie[]);
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
    } finally {
      setLoadingSearch(false);
    }
  }

  async function addMovie(movie: Movie) {
    const user = await ensureUser();
    if (!user) return;

    const exists = watchlist.some((m) => m.imdb_id === movie.imdb_id);
    if (exists) return;

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

    if (!error) {
      await loadMovies();
    }
  }

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

  if (loadingPage) {
    return (
      <main className="page-shell">
        <div className="container">
          <p>Lädt...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="container">
        <section className="hero-card">
          <div className="hero-left">
            <p className="eyebrow">Persönliche Filmverwaltung</p>
            <h1>CineTrack</h1>
            <p className="hero-text">
              Verwalte deine Watchlist, entdecke neue Filme und bewerte, was du
              bereits gesehen hast.
            </p>

            <div className="search-row">
              <input
                value={query}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuery(value);
                  searchMovies(value);
                }}
                placeholder="Film suchen..."
              />
              <button>Suchen</button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Filme</span>
              <span className="stat-value">{watchlist.length}</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Gesehen</span>
              <span className="stat-value">{watchedMovies.length}</span>
            </div>

            <div className="progress-card">
              <div className="progress-head">
                <span>Fortschritt</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section-card">
          <h2>Suchergebnisse</h2>

          {loadingSearch ? <p>Suche läuft...</p> : null}

          <div className="results-grid">
            {searchResults.map((movie) => {
              const exists = watchlist.some((m) => m.imdb_id === movie.imdb_id);

              return (
                <div key={movie.id} className="result-card">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="result-poster"
                    />
                  ) : (
                    <div className="result-poster result-fallback">Kein Poster</div>
                  )}

                  <div className="result-body">
                    <h3>{movie.title}</h3>
                    <p className="muted">{movie.year}</p>
                    <p className="result-plot">{movie.plot}</p>

                    <button
                      className="add-btn"
                      onClick={() => addMovie(movie)}
                      disabled={exists}
                    >
                      {exists ? "✓" : "+"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section-card">
          <div className="section-head">
            <h2>Watchlist</h2>
            <span className="section-count">{watchlist.length} Filme</span>
          </div>

          <div className="watchlist-list">
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
      </div>
    </main>
  );
}