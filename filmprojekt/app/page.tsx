"use client";

import { useEffect, useState } from "react";

const API_KEY = "3478142e";

type MovieStatus = "watchlist" | "watched";

type Movie = {
  id: number;
  imdbId: string;
  title: string;
  year: number;
  genres: string[];
  poster: string | null;
  plot: string;
  rating?: number;
  status: MovieStatus;
};

const initialWatchlist: Movie[] = [];

function MovieCard({
  movie,
  onDelete,
  onToggleWatched,
  onRate,
}: any) {
  return (
    <div className="movie-card">
      <div>
        {movie.poster && (
          <img className="movie-poster" src={movie.poster} alt={movie.title} />
        )}
      </div>

      <div className="movie-content">
        <div className="movie-top">
          <div className="movie-title-group">
            <div className="movie-heading-row">
              <h3>{movie.title}</h3>
              <span
                className={
                  movie.status === "watched"
                    ? "badge badge-green"
                    : "badge"
                }
              >
                {movie.status === "watched"
                  ? "Gesehen"
                  : "Watchlist"}
              </span>
            </div>
            <p className="muted">{movie.year}</p>
          </div>
        </div>

        <div className="genres">
          {movie.genres.map((g: string) => (
            <span key={g} className="genre-pill">
              {g}
            </span>
          ))}
        </div>

        <p>{movie.plot}</p>

        <div className="movie-actions">
          <button
            className="secondary-btn"
            onClick={() => onToggleWatched(movie.id)}
          >
            Toggle
          </button>
          <button
            className="danger-btn"
            onClick={() => onDelete(movie.id)}
          >
            Löschen
          </button>
        </div>

        <div className="rating-row">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button
              key={n}
              className={
                movie.rating && n <= movie.rating
                  ? "rate-btn active"
                  : "rate-btn"
              }
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
  const [watchlist, setWatchlist] = useState<Movie[]>(initialWatchlist);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) searchMovies(query);
      else setSearchResults([]);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const watchedCount = watchlist.filter(m => m.status === "watched").length;
  const progress = watchlist.length
    ? Math.round((watchedCount / watchlist.length) * 100)
    : 0;

  async function searchMovies(search: string) {
    setLoading(true);

    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${search}`
    );
    const data = await res.json();

    if (!data.Search) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    const movies = data.Search.map((m: any, i: number) => ({
      id: Date.now() + i,
      imdbId: m.imdbID,
      title: m.Title,
      year: parseInt(m.Year),
      genres: ["Film"],
      poster: m.Poster !== "N/A" ? m.Poster : null,
      plot: "Keine Beschreibung",
      status: "watchlist" as MovieStatus,
    }));

    setSearchResults(movies);
    setLoading(false);
  }

  function addMovie(movie: Movie) {
    if (watchlist.some(m => m.imdbId === movie.imdbId)) return;
    setWatchlist(prev => [{ ...movie, id: Date.now() }, ...prev]);
  }

  function deleteMovie(id: number) {
    setWatchlist(prev => prev.filter(m => m.id !== id));
  }

  function toggleWatched(id: number) {
    setWatchlist(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, status: m.status === "watched" ? "watchlist" : "watched" }
          : m
      )
    );
  }

  function rateMovie(id: number, rating: number) {
    setWatchlist(prev =>
      prev.map(m => (m.id === id ? { ...m, rating } : m))
    );
  }

  return (
    <main className="page">
      <div className="container">

        <section className="hero">
          <div>
            <h1>CineTrack</h1>

            <div className="hero-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Film suchen..."
              />
              <button className="primary-btn">Suchen</button>
            </div>
          </div>

          <div className="hero-right">
            <div className="stat-card">
              <span className="stat-label">Filme</span>
              <strong>{watchlist.length}</strong>
            </div>

            <div className="stat-card">
              <span className="stat-label">Gesehen</span>
              <strong>{watchedCount}</strong>
            </div>

            <div className="progress-card">
              <div className="progress-head">
                <span>Fortschritt</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ ["--progress" as string]: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Suchergebnisse</h2>

          <div className="search-grid">
            {searchResults.map(movie => (
              <div key={movie.id} className="search-card">
                {movie.poster && (
                  <img className="search-poster" src={movie.poster} alt={movie.title} />
                )}
                <div className="search-content">
                  <h3>{movie.title}</h3>
                  <p className="muted">{movie.year}</p>
                  <button
                    className="primary-btn small"
                    onClick={() => addMovie(movie)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Watchlist</h2>

          {watchlist.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onDelete={deleteMovie}
              onToggleWatched={toggleWatched}
              onRate={rateMovie}
            />
          ))}
        </section>

      </div>
    </main>
  );
}