"use client";

const API_KEY = "3478142e";

import React, { useEffect, useState } from "react";

type MovieStatus = "watchlist" | "watched";

type Movie = {
  id: number;
  title: string;
  year: number;
  genres: string[];
  poster: string;
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
    <div style={{ border: "1px solid #ddd", borderRadius: "16px", padding: "16px", background: "#fff" }}>
      <h3>{movie.title}</h3>
      <p>{movie.year}</p>

      <button onClick={() => onToggleWatched(movie.id)}>
        {movie.status === "watched" ? "Zur Watchlist" : "Als gesehen"}
      </button>

      <button onClick={() => onDelete(movie.id)}>Löschen</button>

      <div>
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button key={n} onClick={() => onRate(movie.id, n)}>
            {n}
          </button>
        ))}
      </div>

      {movie.rating && <p>{movie.rating}/10</p>}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState<Movie[]>(initialWatchlist);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [shares, setShares] = useState<SharedUser[]>(initialShares);

  // 🔥 LOAD
  useEffect(() => {
    const savedWatchlist = localStorage.getItem("watchlist");
    const savedShares = localStorage.getItem("shares");

    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
    if (savedShares) setShares(JSON.parse(savedShares));
  }, []);

  // 🔥 SAVE
  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("shares", JSON.stringify(shares));
  }, [shares]);

  async function searchMovies(search: string) {
    if (!search) return;

    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${search}`
    );
    const data = await res.json();

    if (data.Search) {
      const movies = data.Search.map((movie: any) => ({
        id: Date.now() + Math.random(),
        title: movie.Title,
        year: parseInt(movie.Year),
        genres: ["N/A"],
        poster: movie.Poster !== "N/A" ? movie.Poster : "",
        plot: "Keine Beschreibung verfügbar",
        status: "watchlist" as MovieStatus,
      }));

      setSearchResults(movies);
    }
  }

  function addMovie(movie: Movie) {
    if (watchlist.some((m) => m.title === movie.title)) return;
    setWatchlist((prev) => [movie, ...prev]);
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
    <main style={{ padding: "20px" }}>
      <h1>CineTrack</h1>

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          searchMovies(e.target.value);
        }}
        placeholder="Film suchen..."
      />

      <h2>Suchergebnisse</h2>
      {searchResults.map((movie) => (
        <div key={movie.id}>
          <p>{movie.title}</p>
          <button onClick={() => addMovie(movie)}>+</button>
        </div>
      ))}

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
    </main>
  );
}