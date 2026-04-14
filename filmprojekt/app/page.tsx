"use client";

import { useEffect, useState } from "react";

const API_KEY = "3478142e";

type MovieStatus = "watchlist" | "watched";

type Movie = {
  id: number;
  title: string;
  year: number;
  genres: string[];
  poster: string | null;
  plot: string;
  rating?: number;
  status: MovieStatus;
};

type SharedUser = {
  id: number;
  username: string;
  permission: "view" | "edit";
};

const initialWatchlist: Movie[] = [];
const initialShares: SharedUser[] = [];

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
      <div className="movie-poster-wrap">
        {movie.poster ? (
          <img
            className="movie-poster"
            src={movie.poster}
            alt={movie.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="movie-poster fallback">Kein Poster</div>
        )}
      </div>

      <div className="movie-content">
        <div className="movie-top">
          <div>
            <h3>{movie.title}</h3>
            <p className="muted">{movie.year}</p>
          </div>

          <span className={movie.status === "watched" ? "badge badge-green" : "badge"}>
            {movie.status === "watched" ? "Gesehen" : "Watchlist"}
          </span>
        </div>

        <div className="genres">
          {movie.genres.map((genre) => (
            <span key={genre} className="genre-pill">
              {genre}
            </span>
          ))}
        </div>

        <p className="plot">{movie.plot}</p>

        <div className="movie-actions">
          <button className="secondary-btn" onClick={() => onToggleWatched(movie.id)}>
            {movie.status === "watched" ? "Zur Watchlist" : "Als gesehen"}
          </button>

          <button className="danger-btn" onClick={() => onDelete(movie.id)}>
            Löschen
          </button>
        </div>

        <div className="rating-block">
          <div className="rating-row">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                className={movie.rating && n <= movie.rating ? "rate-btn active" : "rate-btn"}
                onClick={() => onRate(movie.id, n)}
              >
                {n}
              </button>
            ))}
          </div>

          {movie.rating ? <span className="rating-text">{movie.rating}/10</span> : null}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState<Movie[]>(initialWatchlist);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [shares, setShares] = useState<SharedUser[]>(initialShares);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedWatchlist = localStorage.getItem("watchlist");
    const savedShares = localStorage.getItem("shares");

    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }

    if (savedShares) {
      setShares(JSON.parse(savedShares));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("shares", JSON.stringify(shares));
  }, [shares]);

  const watchedCount = watchlist.filter((m) => m.status === "watched").length;
  const progress = watchlist.length ? Math.round((watchedCount / watchlist.length) * 100) : 0;

  async function searchMovies(search: string) {
    if (!search.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

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

      const movies: Movie[] = data.Search.map((movie: any, index: number) => ({
        id: Date.now() + index,
        title: movie.Title,
        year: parseInt(movie.Year) || 0,
        genres: ["Film"],
        poster: movie.Poster !== "N/A" ? movie.Poster : null,
        plot: "Noch keine Detailbeschreibung geladen.",
        status: "watchlist",
      }));

      setSearchResults(movies);
    } catch (error) {
      console.error("Fehler bei der Suche:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  function addMovie(movie: Movie) {
    if (watchlist.some((m) => m.title === movie.title && m.year === movie.year)) return;
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
    setWatchlist((prev) => prev.map((m) => (m.id === id ? { ...m, rating } : m)));
  }

  return (
    <main className="page">
      <div className="container">
        <section className="hero">
          <div className="hero-left">
            <div className="hero-badge">🎬 Persönliche Filmverwaltung</div>
            <h1>CineTrack</h1>
            <p className="hero-text">
              Verwalte deine Watchlist, entdecke neue Filme und bewerte, was du bereits gesehen
              hast.
            </p>

            <div className="hero-search">
              <input
                value={query}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuery(value);
                  searchMovies(value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchMovies(query);
                  }
                }}
                placeholder="Suche nach einem Film, z. B. Interstellar"
              />
              <button className="primary-btn" onClick={() => searchMovies(query)}>
                Suchen
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
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Suchergebnisse</h2>
            {loading ? <span className="muted">Suche läuft...</span> : null}
          </div>

          {searchResults.length === 0 ? (
            <div className="empty-state">
              <p>Suche nach einem Film, um Ergebnisse anzuzeigen.</p>
            </div>
          ) : (
            <div className="search-grid">
              {searchResults.map((movie) => (
                <div key={movie.id} className="search-card">
                  <div className="search-poster-wrap">
                    {movie.poster ? (
                      <img
                        className="search-poster"
                        src={movie.poster}
                        alt={movie.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="search-poster fallback">Kein Poster</div>
                    )}
                  </div>

                  <div className="search-content">
                    <h3>{movie.title}</h3>
                    <p className="muted">{movie.year}</p>

                    <button className="primary-btn small" onClick={() => addMovie(movie)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Watchlist</h2>
            <span className="muted">{watchlist.length} Filme</span>
          </div>

          {watchlist.length === 0 ? (
            <div className="empty-state">
              <p>Deine Watchlist ist noch leer.</p>
            </div>
          ) : (
            <div className="watchlist-grid">
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
          )}
        </section>
      </div>
    </main>
  );
}