import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { TrailerModal } from "@/components/TrailerModalRebuilt";
import { ReviewModal } from "@/components/ReviewModal";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { SearchResults } from "@/components/SearchResults";
import { trendingTrailers, Movie, categories, tvSeriesCategory } from "@/data/movies";
import { useMovies, toFrontendMovie } from "@/hooks/useMovies";
import { useUpcomingTrailers, upcomingToMovie } from "@/hooks/useUpcomingTrailers";
import { deduplicateMovies } from "@/lib/utils/movies";
import { useMovieRatings } from "@/hooks/useMovieRatings";
import { Flame } from "lucide-react";

const Trending = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [reviewMovie, setReviewMovie] = useState<Movie | null>(null);
  const { trendingDbMovies, getDbMoviesByCategory, dbMovies } = useMovies();
  const { upcomingTrailers } = useUpcomingTrailers();
  const { getMovieRating, refetch: refetchRatings } = useMovieRatings();
  const navigate = useNavigate();

  // Scroll to top when searching starts
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery]);

  const mergedTrendingTrailers = useMemo(() => ({
    ...trendingTrailers,
    movies: deduplicateMovies([...trendingDbMovies, ...trendingTrailers.movies]),
  }), [trendingDbMovies]);

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
        title="Trending Trailers - TrailersHub"
        description="Watch the most trending movie trailers right now"
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
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Flame className="h-5 w-5 text-primary" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">
                  Trending Now
                </h1>
              </div>
              <p className="text-muted-foreground">
                The most popular trailers right now
              </p>
            </div>

            <div className="container px-4 md:px-6">
              {mergedTrendingTrailers.movies.length === 0 ? (
                <div className="text-center py-16">
                  <Flame className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No trending trailers</h2>
                  <p className="text-muted-foreground">
                    Check back later for trending content
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {mergedTrendingTrailers.movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onPlayTrailer={handlePlayTrailer}
                      onReviewClick={handleReviewClick}
                    />
                  ))}
                </div>
              )}
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

export default Trending;

