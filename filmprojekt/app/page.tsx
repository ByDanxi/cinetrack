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
}: {
  movie: Movie;
  onDelete: (id: number) => void;
  onToggleWatched: (id: number) => void;
  onRate: (id: number, rating: number) => void;
}) {
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
                className={movie.status === "watched" ? "badge badge-green" : "badge"}
              >
                {movie.status === "watched" ? "Gesehen" : "Watchlist"}
              </span>
            </div>
            <p className="muted">{movie.year}</p>
          </div>
        </div>

        <div className="genres">
          {movie.genres.map((g) => (
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
            {movie.status === "watched" ? "Zur Watchlist" : "Gesehen"}
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

  // 👉 NEU: Expand State
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // 👉 Live Search mit 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) {
        searchMovies(query);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [query]);

  const watchedCount = watchlist.filter((m) => m.status === "watched").length;
  const progress = watchlist.length
    ? Math.round((watchedCount / watchlist.length) * 100)
    : 0;

  async function searchMovies(search: string) {
    setLoading(true);

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(search)}`
      );
      const data = await res.json();

      if (!data.Search) {
        setSearchResults([]);
        return;
      }

      const movies: Movie[] = await Promise.all(
        data.Search.slice(0, 8).map(async (m: any, i: number) => {
          const detailRes = await fetch(
            `https://www.omdbapi.com/?apikey=${API_KEY}&i=${m.imdbID}&plot=full`
          );
          const detail = await detailRes.json();

          return {
            id: Date.now() + i,
            imdbId: m.imdbID,
            title: detail.Title,
            year: parseInt(detail.Year) || 0,
            genres:
              detail.Genre && detail.Genre !== "N/A"
                ? detail.Genre.split(", ").slice(0, 3)
                : ["Unbekannt"],
            poster: detail.Poster !== "N/A" ? detail.Poster : null,
            plot:
              detail.Plot && detail.Plot !== "N/A"
                ? detail.Plot
                : "Keine Beschreibung verfügbar",
            rating:
              detail.imdbRating && detail.imdbRating !== "N/A"
                ? Math.round(Number(detail.imdbRating))
                : undefined,
            status: "watchlist",
          };
        })
      );

      setSearchResults(movies);
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  function addMovie(movie: Movie) {
    if (watchlist.some((m) => m.imdbId === movie.imdbId)) return;
    setWatchlist((prev) => [{ ...movie, id: Date.now() }, ...prev]);
  }

  function deleteMovie(id: number) {
    setWatchlist((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleWatched(id: number) {
    setWatchlist((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === "watched" ? "watchlist" : "watched" }
          : m
      )
    );
  }

  function rateMovie(id: number, rating: number) {
    setWatchlist((prev) =>
      prev.map((m) => (m.id === id ? { ...m, rating } : m))
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
              <button className="primary-btn" disabled={loading}>
                {loading ? "Suche..." : "Suchen"}
              </button>
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

          {loading ? (
            <p className="muted">Suche läuft...</p>
          ) : (
            <div className="search-grid">
              {searchResults.map((movie) => (
                <div key={movie.id} className="search-card">
                  {movie.poster && (
                    <img
                      className="search-poster"
                      src={movie.poster}
                      alt={movie.title}
                    />
                  )}

                  <div className="search-content">
                    <h3>{movie.title}</h3>
                    <p className="muted">{movie.year}</p>

                    <div className="genres">
                      {movie.genres.map((g) => (
                        <span key={g} className="genre-pill">
                          {g}
                        </span>
                      ))}
                    </div>

                    <p
                      className={
                        expandedId === movie.id
                          ? "plot expanded"
                          : "plot"
                      }
                    >
                      {movie.plot}
                    </p>

                    {movie.plot.length > 120 && (
                      <button
                        className="read-more"
                        onClick={() =>
                          setExpandedId(
                            expandedId === movie.id ? null : movie.id
                          )
                        }
                      >
                        {expandedId === movie.id
                          ? "Weniger anzeigen"
                          : "Mehr lesen"}
                      </button>
                    )}

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
          )}
        </section>

        <section className="section">
          <h2>Watchlist</h2>

          {watchlist.map((movie) => (
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