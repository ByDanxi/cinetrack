import { createClient } from "../../utils/supabase/server";
import WatchlistClient from "./watchlist-client";

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

function sortMovies(movies: Movie[]) {
  return [...movies].sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === "watchlist") return -1;
    return 1;
  });
}

export default async function WatchlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialMovies: Movie[] = [];
  let initialWatchlists: Watchlist[] = [];
  let initialSelectedWatchlistId: string | null = null;

  let debug = {
    userId: user?.id ?? null,
    membershipError: null as string | null,
    membershipsCount: 0,
    watchlistsError: null as string | null,
    watchlistsCount: 0,
    moviesError: null as string | null,
    selectedWatchlistId: null as string | null,
  };

  if (user) {
    const { data: membershipData, error: membershipError } = await supabase
      .from("watchlist_members")
      .select("watchlist_id, role")
      .eq("user_id", user.id);

    if (membershipError) {
      debug.membershipError = membershipError.message;
    }

    debug.membershipsCount = membershipData?.length ?? 0;

    if (membershipData && membershipData.length > 0) {
      const watchlistIds = membershipData.map((item) => item.watchlist_id);

      const { data: watchlistsData, error: watchlistsError } = await supabase
        .from("watchlists")
        .select("id, name, user_id, created_at")
        .in("id", watchlistIds)
        .order("created_at", { ascending: true });

      if (watchlistsError) {
        debug.watchlistsError = watchlistsError.message;
      }

      debug.watchlistsCount = watchlistsData?.length ?? 0;

      if (watchlistsData) {
        initialWatchlists = watchlistsData.map((watchlist) => {
          const membership = membershipData.find(
            (item) => item.watchlist_id === watchlist.id
          );

          return {
            ...(watchlist as Omit<Watchlist, "role">),
            role: (membership?.role as "owner" | "member") || "member",
          };
        });

        if (initialWatchlists.length > 0) {
          initialSelectedWatchlistId = initialWatchlists[0].id;
          debug.selectedWatchlistId = initialSelectedWatchlistId;

          const { data: moviesData, error: moviesError } = await supabase
            .from("movies")
            .select(
              "id, title, year, poster, plot, rating, status, imdb_id, user_id, watchlist_id"
            )
            .eq("watchlist_id", initialSelectedWatchlistId)
            .order("created_at", { ascending: false });

          if (moviesError) {
            debug.moviesError = moviesError.message;
          }

          if (moviesData) {
            initialMovies = sortMovies((moviesData || []) as Movie[]);
          }
        }
      }
    }
  }

  return (
    <>
      <div
        style={{
          margin: "16px",
          padding: "12px 16px",
          borderRadius: "12px",
          background: "#fff7ed",
          border: "1px solid #fdba74",
          color: "#9a3412",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        <strong>Debug WatchlistPage</strong>
        <div>User ID: {String(debug.userId)}</div>
        <div>Memberships Count: {debug.membershipsCount}</div>
        <div>Membership Error: {debug.membershipError ?? "none"}</div>
        <div>Watchlists Count: {debug.watchlistsCount}</div>
        <div>Watchlists Error: {debug.watchlistsError ?? "none"}</div>
        <div>Selected Watchlist: {debug.selectedWatchlistId ?? "none"}</div>
        <div>Movies Error: {debug.moviesError ?? "none"}</div>
      </div>

      <WatchlistClient
        initialMovies={initialMovies}
        initialWatchlists={initialWatchlists}
        initialSelectedWatchlistId={initialSelectedWatchlistId}
      />
    </>
  );
}