import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { UpcomingSection } from "@/components/UpcomingSection";
import { SearchResults } from "@/components/SearchResults";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useMovies, toFrontendMovie } from "@/hooks/useMovies";
import { useUpcomingTrailers, upcomingToMovie } from "@/hooks/useUpcomingTrailers";
import { categories, tvSeriesCategory, Movie } from "@/data/movies";
import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const Upcoming = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { getDbMoviesByCategory, dbMovies } = useMovies();
  const { upcomingTrailers } = useUpcomingTrailers();
  const navigate = useNavigate();

  // Scroll to top when searching starts
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery]);

  const handlePlayTrailer = useCallback((movie: Movie) => {
    navigate(`/watch/${movie.id}`);
  }, [navigate]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const seen = new Set<string>();
    const results: { movie: Movie; categoryName: string }[] = [];

    const addIfMatches = (movie: Movie, categoryName: string) => {
      if (movie.title.toLowerCase().includes(query) && !seen.has(movie.id)) {
        seen.add(movie.id);
        results.push({ movie, categoryName });
      }
    };

    // 1. Search in all DB movies
    dbMovies.forEach(dbMovie => {
      const cat = categories.find(c => c.id === dbMovie.category.toLowerCase()) ||
        (dbMovie.category.toLowerCase() === 'tv-series' ? { name: 'TV Series' } : null);
      addIfMatches(toFrontendMovie(dbMovie), cat?.name || "Movie");
    });

    // 2. Search in static categories
    categories.forEach(category => {
      category.movies.forEach(movie => addIfMatches(movie, category.name));
    });

    // 3. TV Series Category (static)
    tvSeriesCategory.movies.forEach(movie => addIfMatches(movie, "TV Series"));

    // 4. Upcoming trailers
    upcomingTrailers.forEach(trailer => {
      addIfMatches(upcomingToMovie(trailer), "Upcoming");
    });

    return results;
  }, [searchQuery, dbMovies, upcomingTrailers]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="relative min-h-screen bg-background">
      <SEOHead
        title="Upcoming Trailers - TrailersHub"
        description="Discover upcoming movie trailers and get notified when they're released"
      />

      <div className="edge-glow" aria-hidden="true" />
      <div className="edge-glow-extra" aria-hidden="true" />

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
      />

      <main>
        {isSearching ? (
          <div className="pt-24 pb-8">
            <SearchResults
              results={searchResults}
              searchQuery={searchQuery}
              onPlayTrailer={handlePlayTrailer}
            />
          </div>
        ) : (
          <div className="pt-24">
            <UpcomingSection />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Upcoming;

