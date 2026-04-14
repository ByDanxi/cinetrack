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
  runtime?: string;
  director?: string;
  actors?: string;
  imdbRating?: number;
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
      <div className="movie-poster-wrap">
        {movie.poster ? (
          <img
            className="movie-poster"
            src={movie.poster}
            alt={movie.title}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="fallback">Kein Poster</div>
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

        <div className="movie-meta">
          {movie.runtime ? <span className="meta-pill">⏱ {movie.runtime}</span> : null}
          {movie.director ? <span className="meta-pill">🎬 {movie.director}</span> : null}
          {movie.imdbRating ? <span className="meta-pill">⭐ IMDb {movie.imdbRating}</span> : null}
        </div>

        {movie.actors ? <p className="muted">Cast: {movie.actors}</p> : null}

        <div className="movie-actions">
          <button className="secondary-btn" onClick={() => onToggleWatched(movie.id)}>
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
              className={movie.rating && n <= movie.rating ? "rate-btn active" : "rate-btn"}
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
    const savedWatchlist = localStorage.getItem("watchlist");

    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      searchMovies(trimmed);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const watchedCount = watchlist.filter((m) => m.status === "watched").length;
  const progress = watchlist.length ? Math.round((watchedCount / watchlist.length) * 100) : 0;

  async function searchMovies(search: string) {
    const trimmed = search.trim();

    if (!trimmed) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();

      if (!data.Search) {
        setSearchResults([]);
        return;
      }

      const movies: Movie[] = await Promise.all(
        data.Search.slice(0, 8).map(async (movie: any, index: number) => {
          const detailRes = await fetch(
            `https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}&plot=full`
          );
          const detailData = await detailRes.json();

          return {
            id: Date.now() + index,
            imdbId: detailData.imdbID,
            title: detailData.Title,
            year: parseInt(detailData.Year) || 0,
            genres:
              detailData.Genre && detailData.Genre !== "N/A"
                ? detailData.Genre.split(",").map((genre: string) => genre.trim())
                : ["Unbekannt"],
            poster: detailData.Poster !== "N/A" ? detailData.Poster : null,
            plot:
              detailData.Plot && detailData.Plot !== "N/A"
                ? detailData.Plot
                : "Keine Beschreibung verfügbar.",
            runtime:
              detailData.Runtime && detailData.Runtime !== "N/A"
                ? detailData.Runtime
                : undefined,
            director:
              detailData.Director && detailData.Director !== "N/A"
                ? detailData.Director
                : undefined,
            actors:
              detailData.Actors && detailData.Actors !== "N/A"
                ? detailData.Actors
                : undefined,
            imdbRating:
              detailData.imdbRating && detailData.imdbRating !== "N/A"
                ? Number(detailData.imdbRating)
                : undefined,
            status: "watchlist",
          };
        })
      );

      setSearchResults(movies);
    } catch (error) {
      console.error("Fehler bei der Suche:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  function addMovie(movie: Movie) {
    if (watchlist.some((m) => m.imdbId === movie.imdbId)) {
      return;
    }

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
            <div className="hero-badge">Persönliche Filmverwaltung</div>
            <h1>CineTrack</h1>
            <p className="hero-text">
              Verwalte deine Watchlist, entdecke neue Filme und bewerte, was du bereits gesehen
              hast.
            </p>

            <div className="hero-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach einem Film, z. B. Avatar"
              />

              <button
                className="primary-btn"
                onClick={() => searchMovies(query)}
                disabled={loading}
              >
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
              <div className="section-head">
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
          <div className="section-head">
            <h2>Suchergebnisse</h2>
            {loading ? <span className="muted">Suche läuft...</span> : null}
          </div>

          {searchResults.length === 0 ? (
            <p className="muted">Suche nach einem Film, um Ergebnisse anzuzeigen.</p>
          ) : (
            <div className="search-grid">
              {searchResults.map((movie) => (
                <div key={movie.id} className="search-card">
                  {movie.poster ? (
                    <img
                      className="search-poster"
                      src={movie.poster}
                      alt={movie.title}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}

                  <div className="search-content">
                    <h3>{movie.title}</h3>
                    <p className="muted">{movie.year}</p>

                    <div className="genres">
                      {movie.genres.slice(0, 3).map((genre) => (
                        <span key={genre} className="genre-pill">
                          {genre}
                        </span>
                      ))}
                    </div>

                    <p className="plot">{movie.plot}</p>

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
            <p className="muted">Deine Watchlist ist noch leer.</p>
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