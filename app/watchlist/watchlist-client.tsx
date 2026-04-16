"use client";

import { useEffect, useMemo, useState } from "react";
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
  role: "owner" | "member";
};

type WatchlistMember = {
  id: string;
  user_id: string;
  role: "owner" | "member";
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
  const [members, setMembers] = useState<WatchlistMember[]>([]);
  const [newListName, setNewListName] = useState("");
  const [shareUserId, setShareUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedWatchlist = useMemo(
    () => watchlists.find((list) => list.id === selectedWatchlistId) || null,
    [watchlists, selectedWatchlistId]
  );

  const isOwner = selectedWatchlist?.role === "owner";

  useEffect(() => {
  if (!selectedWatchlistId) {
    setMembers([]);
    return;
  }

  loadMembers(selectedWatchlistId);
}, [selectedWatchlistId]);

 async function loadMembers(watchlistId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setMembers([]);
    return;
  }

  const { data, error } = await supabase
    .from("watchlist_members")
    .select("id, user_id, role")
    .eq("watchlist_id", watchlistId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    setMembers([]);
    return;
  }

  setMembers((data || []) as WatchlistMember[]);
}

  async function loadMoviesForWatchlist(watchlistId: string) {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("movies")
      .select(
        "id, title, year, poster, plot, rating, status, imdb_id, user_id, watchlist_id"
      )
      .eq("watchlist_id", watchlistId)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setWatchlist(sortMovies((data || []) as Movie[]));
    await loadMembers(watchlistId);
    setIsLoading(false);
  }

  async function handleSelectWatchlist(watchlistId: string) {
    if (!watchlistId) return;
    setSelectedWatchlistId(watchlistId);
    await loadMoviesForWatchlist(watchlistId);
  }

  async function createWatchlist() {
    const trimmedName = newListName.trim();
    if (!trimmedName) return;

    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("User konnte nicht geladen werden.");
      return;
    }

    const { data, error } = await supabase
      .from("watchlists")
      .insert({
        name: trimmedName,
        user_id: user.id,
      })
      .select("id, name, user_id, created_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data) {
      const createdWatchlist: Watchlist = {
        ...(data as Omit<Watchlist, "role">),
        role: "owner",
      };

      setWatchlists((prev) => [...prev, createdWatchlist]);
      setSelectedWatchlistId(createdWatchlist.id);
      setWatchlist([]);
      setMembers([
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          role: "owner",
        },
      ]);
      setNewListName("");
      setSuccessMessage("Watchlist wurde erstellt.");
    }
  }

  async function deleteSelectedWatchlist() {
    if (!selectedWatchlistId || !selectedWatchlist) return;

    if (!isOwner) {
      setErrorMessage("Nur der Besitzer kann diese Watchlist löschen.");
      return;
    }

    if (watchlists.filter((w) => w.role === "owner").length <= 1) {
      setErrorMessage("Mindestens eine eigene Watchlist muss bestehen bleiben.");
      return;
    }

    const confirmed = window.confirm(
      "Willst du diese Watchlist wirklich löschen? Alle Filme in dieser Liste werden ebenfalls gelöscht."
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const currentIndex = watchlists.findIndex((w) => w.id === selectedWatchlistId);
    const fallbackWatchlist =
      watchlists.find((w) => w.id !== selectedWatchlistId) || null;

    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("id", selectedWatchlistId);

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    const updatedWatchlists = watchlists.filter(
      (w) => w.id !== selectedWatchlistId
    );

    setWatchlists(updatedWatchlists);

    const nextWatchlist =
      updatedWatchlists[currentIndex] ||
      updatedWatchlists[currentIndex - 1] ||
      fallbackWatchlist;

    if (nextWatchlist) {
      setSelectedWatchlistId(nextWatchlist.id);
      await loadMoviesForWatchlist(nextWatchlist.id);
    } else {
      setSelectedWatchlistId(null);
      setWatchlist([]);
      setMembers([]);
      setIsLoading(false);
    }
  }

  async function deleteMovie(id: string) {
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.from("movies").delete().eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setWatchlist((prev) => sortMovies(prev.filter((movie) => movie.id !== id)));
  }

  async function toggleWatched(id: string) {
    const movie = watchlist.find((m) => m.id === id);
    if (!movie) return;

    setErrorMessage("");
    setSuccessMessage("");

    const newStatus: MovieStatus =
      movie.status === "watched" ? "watchlist" : "watched";

    const { error } = await supabase
      .from("movies")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setWatchlist((prev) =>
      sortMovies(prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)))
    );
  }

  async function addMember() {
    const trimmedUserId = shareUserId.trim();

    if (!selectedWatchlistId) return;

    if (!isOwner) {
      setErrorMessage("Nur der Besitzer kann Mitglieder hinzufügen.");
      return;
    }

    if (!trimmedUserId) return;

    setErrorMessage("");
    setSuccessMessage("");

    const alreadyExists = members.some((member) => member.user_id === trimmedUserId);
    if (alreadyExists) {
      setErrorMessage("Dieser User ist bereits in der Watchlist.");
      return;
    }

    const { data, error } = await supabase
      .from("watchlist_members")
      .insert({
        watchlist_id: selectedWatchlistId,
        user_id: trimmedUserId,
        role: "member",
      })
      .select("id, user_id, role")
      .single();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data) {
      setMembers((prev) => [...prev, data as WatchlistMember]);
      setShareUserId("");
      setSuccessMessage("Mitglied wurde hinzugefügt.");
    }
  }

  async function removeMember(memberId: string, memberRole: "owner" | "member") {
    if (!selectedWatchlistId) return;

    if (!isOwner) {
      setErrorMessage("Nur der Besitzer kann Mitglieder entfernen.");
      return;
    }

    if (memberRole === "owner") {
      setErrorMessage("Der Besitzer kann nicht entfernt werden.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("watchlist_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMembers((prev) => prev.filter((member) => member.id !== memberId));
    setSuccessMessage("Mitglied wurde entfernt.");
  }

  return (
    <section className="section-card">
      <div className="section-head">
        <div>
          <h1>Watchlist</h1>
          {selectedWatchlist ? (
            <p style={{ margin: "8px 0 0", color: "#64748b" }}>
              {selectedWatchlist.name} ·{" "}
              {selectedWatchlist.role === "owner" ? "Eigene Liste" : "Geteilte Liste"}
            </p>
          ) : null}
        </div>

        {selectedWatchlistId && watchlist.length > 0 ? (
          <span className="section-count">
            {watchlist.length} Film{watchlist.length !== 1 ? "e" : ""}
          </span>
        ) : null}
      </div>

      <div className="watchlist-toolbar">
        <div className="watchlist-toolbar-row">
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
            {watchlists.length === 0 ? (
              <option value="">Keine Watchlist vorhanden</option>
            ) : (
              watchlists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} {list.role === "member" ? "• geteilt" : ""}
                </option>
              ))
            )}
          </select>

          {isOwner ? (
            <button
              type="button"
              className="danger-btn"
              onClick={deleteSelectedWatchlist}
            >
              Watchlist löschen
            </button>
          ) : null}
        </div>

        <div className="watchlist-toolbar-row">
          <input
            type="text"
            placeholder="Neue Watchlist"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="watchlist-input"
          />

          <button type="button" onClick={createWatchlist}>
            Erstellen
          </button>
        </div>

        {selectedWatchlistId && isOwner ? (
          <div className="watchlist-toolbar-row">
            <input
              type="text"
              placeholder="User-ID zum Teilen"
              value={shareUserId}
              onChange={(e) => setShareUserId(e.target.value)}
              className="watchlist-input"
            />

            <button type="button" onClick={addMember}>
              Mitglied hinzufügen
            </button>
          </div>
        ) : null}
      </div>

      {selectedWatchlistId ? (
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ marginBottom: "12px" }}>Mitglieder</h2>
          {members.length === 0 ? (
            <p>Noch keine Mitglieder geladen.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{member.role === "owner" ? "Owner" : "Mitglied"}</strong>
                    <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                      {member.user_id}
                    </p>
                  </div>

                  {isOwner && member.role !== "owner" ? (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => removeMember(member.id, member.role)}
                    >
                      Entfernen
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {errorMessage ? <p>{errorMessage}</p> : null}
      {successMessage ? <p>{successMessage}</p> : null}
      {isLoading ? <p>Filme werden geladen...</p> : null}

      {!isLoading && !errorMessage && watchlist.length === 0 ? (
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