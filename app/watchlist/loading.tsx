export default function Loading() {
  return (
    <section className="section-card">
      <div className="section-head">
        <h1>Watchlist</h1>
      </div>

      <div className="watchlist-list">
        <div className="watchlist-card">
          <div className="watchlist-poster-wrap">
            <div className="watchlist-poster skeleton" />
          </div>

          <div className="watchlist-content">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>

        <div className="watchlist-card">
          <div className="watchlist-poster-wrap">
            <div className="watchlist-poster skeleton" />
          </div>

          <div className="watchlist-content">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>

        <div className="watchlist-card">
          <div className="watchlist-poster-wrap">
            <div className="watchlist-poster skeleton" />
          </div>

          <div className="watchlist-content">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      </div>
    </section>
  );
}