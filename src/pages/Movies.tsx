import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategorySection } from "@/components/CategorySection";
import { TrailerModal } from "@/components/TrailerModal";
import { ReviewModal } from "@/components/ReviewModal";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { SearchResults } from "@/components/SearchResults";
import { categories, tvSeriesCategory, Movie, Category } from "@/data/movies";
import { useMovies, toFrontendMovie } from "@/hooks/useMovies";
import { useUpcomingTrailers, upcomingToMovie } from "@/hooks/useUpcomingTrailers";
import { useMovieRatings } from "@/hooks/useMovieRatings";
import { deduplicateMovies } from "@/lib/utils/movies";

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [reviewMovie, setReviewMovie] = useState<Movie | null>(null);
  const { getDbMoviesByCategory, dbMovies } = useMovies();
  const { upcomingTrailers } = useUpcomingTrailers();
  const { getMovieRating, refetch: refetchRatings } = useMovieRatings();
  const navigate = useNavigate();

  // Scroll to top when searching starts
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery]);

  const mergedCategories = useMemo(() => {
    return categories.map(category => ({
      ...category,
      movies: deduplicateMovies([...getDbMoviesByCategory(category.id), ...category.movies]),
    }));
  }, [getDbMoviesByCategory]);

  const mergedTVSeriesCategory: Category = useMemo(() => ({
    ...tvSeriesCategory,
    movies: deduplicateMovies([...getDbMoviesByCategory('tv-series'), ...tvSeriesCategory.movies]),
  }), [getDbMoviesByCategory]);

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

    // Deduplicate results by movie title/year to be safe
    const finalResults: { movie: Movie; categoryName: string }[] = [];
    const resultsSeen = new Set<string>();

    results.forEach(item => {
      const key = `${item.movie.title.toLowerCase().trim()}-${item.movie.year}`;
      if (!resultsSeen.has(key)) {
        resultsSeen.add(key);
        finalResults.push(item);
      }
    });

    return finalResults;
  }, [searchQuery, dbMovies, upcomingTrailers]);

  const isSearching = searchQuery.trim().length > 0;

  const handlePlayTrailer = useCallback((movie: Movie) => {
    // Navigate to watch page with movie ID
    navigate(`/watch/${movie.id}`);
  }, [navigate]);

  const handleCloseTrailer = useCallback(() => {
    setSelectedMovie(null);
  }, []);

  const handleReviewClick = useCallback((movie: Movie) => {
    setReviewMovie(movie);
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <SEOHead
        title="All Movies - TrailersHub"
        description="Browse all movies and trailers by category"
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
          <div className="pt-24 pb-8">
            <div className="container px-4 md:px-6 mb-8">
              <h1 className="font-display text-3xl md:text-4xl tracking-wide text-foreground mb-2">
                All Movies
              </h1>
              <p className="text-muted-foreground">
                Browse all movies and trailers by category
              </p>
            </div>

            <div id="categories" className="py-8">
              {/* TV Series Category */}
              <CategorySection
                key={mergedTVSeriesCategory.id}
                category={mergedTVSeriesCategory}
                index={0}
                onPlayTrailer={handlePlayTrailer}
                onReviewClick={handleReviewClick}
              />

              {mergedCategories.map((category, index) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  index={index + 1}
                  onPlayTrailer={handlePlayTrailer}
                  onReviewClick={handleReviewClick}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />

      <TrailerModal
        key={selectedMovie ? `trailer-modal-${selectedMovie.id}` : 'trailer-modal-closed'}
        isOpen={!!selectedMovie}
        onClose={handleCloseTrailer}
        trailerUrl={selectedMovie?.trailerUrl || ""}
        movieTitle={selectedMovie?.title || ""}
        currentMovie={selectedMovie}
        onPlayTrailer={handlePlayTrailer}
      />

      <ReviewModal
        isOpen={!!reviewMovie}
        onClose={() => {
          setReviewMovie(null);
          refetchRatings();
        }}
        movie={reviewMovie}
      />
    </div>
  );
};

export default Movies;

