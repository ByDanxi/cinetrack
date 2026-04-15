export default function HomePage() {
  return (
    <main className="bg-gray-100 min-h-screen">
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