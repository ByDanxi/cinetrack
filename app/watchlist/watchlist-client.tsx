"use client";

import { useState } from "react";
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

function sortMovies(movies: Movie[]) {
  return [...movies].sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === "watchlist") return -1;
    return 1;
  });
}

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
    <article className="watchlist-card">
      <div className="watchlist-poster-wrap">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="watchlist-poster"
          />
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
            className={`status-badge ${
              movie.status === "watched"
                ? "status-badge-watched"
                : "status-badge-watchlist"
            }`}
          >
            {movie.status === "watched" ? "Gesehen" : "Watchlist"}
          </span>
        </div>

        <p className="watchlist-year" style={{ marginBottom: 16 }}>
          Bewertung: {movie.rating != null ? `${movie.rating}/10` : "—"}
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
              className={`rating-pill ${movie.rating === n ? "active" : ""}`}
              onClick={() => onRate(movie.id, n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function WatchlistClient({
  initialMovies,
}: {
  initialMovies: Movie[];
}) {
  const [watchlist, setWatchlist] = useState<Movie[]>(initialMovies);

  async function deleteMovie(id: string) {
    const { error } = await supabase.from("watchlist").delete().eq("id", id);

    if (!error) {
      setWatchlist((prev) =>
        sortMovies(prev.filter((movie) => movie.id !== id))
      );
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
        sortMovies(
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        )
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
    <section className="section-card">
      <div className="section-head">
        <h1>Watchlist</h1>
        {watchlist.length > 0 ? (
          <span className="section-count">
            {watchlist.length} Film{watchlist.length !== 1 ? "e" : ""}
          </span>
        ) : null}
      </div>

      {watchlist.length === 0 ? <p>Noch keine Filme gespeichert.</p> : null}

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
  );
}