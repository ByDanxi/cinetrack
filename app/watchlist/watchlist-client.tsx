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
  watchlist_id: string;
};

type Watchlist = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
};

type WatchlistClientProps = {
  initialMovies: Movie[];
  initialWatchlists: Watchlist[];
  initialSelectedWatchlistId: string | null;
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
}: {
  movie: Movie;
  onDelete: (id: string) => void;
  onToggleWatched: (id: string) => void;
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

        <div className="watchlist-actions">
          <button onClick={() => onToggleWatched(movie.id)}>
            {movie.status === "watched" ? "Zur Watchlist" : "Als gesehen"}
          </button>

          <button className="danger-btn" onClick={() => onDelete(movie.id)}>
            Löschen
          </button>
        </div>
      </div>
    </article>
  );
}

export default function WatchlistClient({
  initialMovies,
  initialWatchlists,
  initialSelectedWatchlistId,
}: WatchlistClientProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(initialWatchlists);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(
    initialSelectedWatchlistId
  );
  const [watchlist, setWatchlist] = useState<Movie[]>(initialMovies);
  const [newListName, setNewListName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadMoviesForWatchlist(watchlistId: string) {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("movies")
      .select(
        "id, title, year, poster, plot, rating, status, imdb_id, user_id, watchlist_id"
      )
      .eq("watchlist_id", watchlistId)
      .order("created_at", { ascending: false });

    if (!error) {
      setWatchlist(sortMovies((data || []) as Movie[]));
    }

    setIsLoading(false);
  }

  async function handleSelectWatchlist(watchlistId: string) {
    setSelectedWatchlistId(watchlistId);
    await loadMoviesForWatchlist(watchlistId);
  }

  async function createWatchlist() {
    const trimmedName = newListName.trim();
    if (!trimmedName) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("watchlists")
      .insert({
        name: trimmedName,
        user_id: user.id,
      })
      .select("id, name, user_id, created_at")
      .single();

    if (!error && data) {
      const createdWatchlist = data as Watchlist;

      setWatchlists((prev) => [...prev, createdWatchlist]);
      setNewListName("");
      setSelectedWatchlistId(createdWatchlist.id);
      setWatchlist([]);
    }
  }

  async function deleteMovie(id: string) {
    const { error } = await supabase.from("movies").delete().eq("id", id);

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
      .from("movies")
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

  return (
    <section className="section-card">
      <div className="section-head">
        <h1>Watchlist</h1>
        {selectedWatchlistId && watchlist.length > 0 ? (
          <span className="section-count">
            {watchlist.length} Film{watchlist.length !== 1 ? "e" : ""}
          </span>
        ) : null}
      </div>

      <div className="watchlist-toolbar">
        <label htmlFor="watchlist-select" className="sr-only">
          Watchlist auswählen
        </label>

        <select
          id="watchlist-select"
          aria-label="Watchlist auswählen"
          value={selectedWatchlistId ?? ""}
          onChange={(e) => handleSelectWatchlist(e.target.value)}
          className="watchlist-select"
        >
          {watchlists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Neue Watchlist"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          className="watchlist-input"
        />

        <button onClick={createWatchlist}>Erstellen</button>
      </div>

      {isLoading ? <p>Filme werden geladen...</p> : null}

      {!isLoading && watchlist.length === 0 ? (
        <p>Noch keine Filme gespeichert.</p>
      ) : null}

      <div className="watchlist-list">
        {watchlist.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onDelete={deleteMovie}
            onToggleWatched={toggleWatched}
          />
        ))}
      </div>
    </section>
  );
}