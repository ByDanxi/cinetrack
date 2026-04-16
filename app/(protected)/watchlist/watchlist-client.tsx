"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../utils/supabase/client";

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
  profiles?: {
    username: string;
  }[] | null;
};

export default function WatchlistClient({
  initialMovies,
  initialWatchlists,
  initialSelectedWatchlistId,
}: {
  initialMovies: Movie[];
  initialWatchlists: Watchlist[];
  initialSelectedWatchlistId: string | null;
}) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(initialWatchlists);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(
    initialSelectedWatchlistId
  );
  const [watchlist, setWatchlist] = useState<Movie[]>(initialMovies);
  const [members, setMembers] = useState<WatchlistMember[]>([]);

  const selectedWatchlist = useMemo(
    () => watchlists.find((list) => list.id === selectedWatchlistId) || null,
    [watchlists, selectedWatchlistId]
  );

  const isOwner = selectedWatchlist?.role === "owner";

  useEffect(() => {
    if (!selectedWatchlistId) return;
    loadMembers(selectedWatchlistId);
  }, [selectedWatchlistId]);

  async function loadMembers(watchlistId: string) {
    const { data } = await supabase
      .from("watchlist_members")
      .select(
        `
        id,
        user_id,
        role,
        profiles (
          username
        )
      `
      )
      .eq("watchlist_id", watchlistId);

    setMembers((data || []) as WatchlistMember[]);
  }

  return (
    <section className="section-card">
      <h1>Watchlist</h1>

      {/* Mitglieder */}
      {selectedWatchlistId && (
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ marginBottom: "12px" }}>Mitglieder</h2>

          {members.filter((m) => m.role !== "owner").length === 0 ? (
            <p>Keine Mitglieder vorhanden.</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {members
                .filter((member) => member.role !== "owner")
                .map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "12px",
                      background: "#f8fafc",
                    }}
                  >
                    <div>
                      <strong>Mitglied</strong>
                      <p style={{ margin: 0 }}>
                        {member.profiles?.[0]?.username || member.user_id}
                      </p>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() =>
                          supabase
                            .from("watchlist_members")
                            .delete()
                            .eq("id", member.id)
                        }
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}