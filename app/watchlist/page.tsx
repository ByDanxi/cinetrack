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

  if (user) {
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      initialMovies = sortMovies((data || []) as Movie[]);
    }
  }

  return <WatchlistClient initialMovies={initialMovies} />;
}