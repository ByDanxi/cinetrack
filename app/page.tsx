export default function HomePage() {
  return (
    <main className="bg-gray-100 min-h-screen">
      
      {/* 🔵 HEADER */}
      <section className="bg-blue-600 text-white p-4 rounded-b-2xl">
        <h1 className="text-xl font-bold">FilmApp</h1>

        <p className="text-sm opacity-90">
          Verwalte deine Watchlist und entdecke neue Filme
        </p>

        <div className="mt-3 flex gap-2">
          <a href="/search">
            <button className="bg-white text-blue-600 px-3 py-2 rounded">
              🔍 Suchen
            </button>
          </a>

          <a href="/watchlist">
            <button className="bg-white text-blue-600 px-3 py-2 rounded">
              🎬 Watchlist
            </button>
          </a>
        </div>
      </section>

      {/* 📊 CONTENT */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          
          <div className="bg-white p-4 rounded-xl">
            <p className="text-gray-500 text-sm">Filme</p>
            <h2 className="text-lg font-bold">0</h2>
          </div>

          <div className="bg-white p-4 rounded-xl">
            <p className="text-gray-500 text-sm">Gesehen</p>
            <h2 className="text-lg font-bold">0</h2>
          </div>

        </div>
      </div>

    </main>
  );
}