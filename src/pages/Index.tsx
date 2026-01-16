import { useState, useMemo, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { RecommendedSection } from "@/components/RecommendedSection";
import { SearchResults } from "@/components/SearchResults";
import { TrailerModal } from "@/components/TrailerModalRebuilt";
import { ReviewModal } from "@/components/ReviewModal";
import { Footer } from "@/components/Footer";
import { SEOHead, SEO_CONFIG } from "@/components/SEOHead";
import { latestTrailers, trendingTrailers, Movie, Category, categories, tvSeriesCategory } from "@/data/movies";
import { useMovies, toFrontendMovie } from "@/hooks/useMovies";
import { useUpcomingTrailers, upcomingToMovie } from "@/hooks/useUpcomingTrailers";
import { deduplicateMovies } from "@/lib/utils/movies";
import { useMovieRatings } from "@/hooks/useMovieRatings";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CategorySection } from "@/components/CategorySection";
import { GenreFilter } from "@/components/GenreFilter";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [reviewMovie, setReviewMovie] = useState<Movie | null>(null);
  const { latestDbMovies, trendingDbMovies, getDbMoviesByCategory, dbMovies, loading: moviesLoading } = useMovies();
  const { upcomingTrailers } = useUpcomingTrailers();
  const { getMovieRating, refetch: refetchRatings } = useMovieRatings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Scroll to top when searching starts
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery]);

  // Stats are now derived from dbMovies length
  const moviesCount = useMemo(() => {
    return dbMovies.length > 50 ? dbMovies.length : 120;
  }, [dbMovies.length]);

  // Filtered movies for Genre selection
  const genreFilteredMovies = useMemo(() => {
    if (!selectedGenre) return [];

    // Combine dbMovies and static movies
    const allMovies = [...dbMovies.map(toFrontendMovie)];

    // Add static if not present
    categories.forEach(cat => {
      cat.movies.forEach(m => {
        if (!allMovies.some(am => am.id === m.id)) {
          allMovies.push(m);
        }
      });
    });

    // Need to filter by genre. 
    // Since static movies don't have explicit genres in their object usually, 
    // we might miss them unless we map static categories to genres or add genres to static data.
    // For now, filtering dbMovies which have 'genres' populated from TMDB is safe.
    // Static movies might need a mapping?
    // Let's filter 'dbMovies' primarily.

    return allMovies.filter(m =>
      m.genres?.some(g => g.toLowerCase() === selectedGenre.toLowerCase())
    );
  }, [selectedGenre, dbMovies]);

  // Merge database movies with static data
  const mergedLatestTrailers: Category = useMemo(() => ({
    ...latestTrailers,
    movies: deduplicateMovies([...latestDbMovies, ...latestTrailers.movies]),
  }), [latestDbMovies]);

  const mergedTrendingTrailers: Category = useMemo(() => ({
    ...trendingTrailers,
    movies: deduplicateMovies([...trendingDbMovies, ...trendingTrailers.movies]),
  }), [trendingDbMovies]);

  const bollywoodCategory = useMemo(() => {
    const staticCat = categories.find(c => c.id === 'bollywood') || { id: 'bollywood', name: 'Bollywood', movies: [] };
    return {
      ...staticCat,
      movies: deduplicateMovies([...getDbMoviesByCategory('bollywood'), ...staticCat.movies]),
    };
  }, [getDbMoviesByCategory]);

  const hollywoodCategory = useMemo(() => {
    const staticCat = categories.find(c => c.id === 'hollywood') || { id: 'hollywood', name: 'Hollywood', movies: [] };
    return {
      ...staticCat,
      movies: deduplicateMovies([...getDbMoviesByCategory('hollywood'), ...staticCat.movies]),
    };
  }, [getDbMoviesByCategory]);

  const nollywoodCategory = useMemo(() => {
    const staticCat = categories.find(c => c.id === 'nollywood') || { id: 'nollywood', name: 'Nollywood', movies: [] };
    return {
      ...staticCat,
      movies: deduplicateMovies([...getDbMoviesByCategory('nollywood'), ...staticCat.movies]),
    };
  }, [getDbMoviesByCategory]);


  // Get all movies for recommended section
  const allMoviesForRecommended = useMemo(() => {
    const seen = new Set<string>();
    const movies: Movie[] = [];

    const addMovie = (movie: Movie) => {
      if (!seen.has(movie.id)) {
        seen.add(movie.id);
        movies.push(movie);
      }
    };

    mergedLatestTrailers.movies.forEach(addMovie);
    mergedTrendingTrailers.movies.forEach(addMovie);

    // Also include categories for recommendations
    categories.forEach(cat => {
      cat.movies.forEach(addMovie);
      getDbMoviesByCategory(cat.id).forEach(addMovie);
    });

    return movies;
  }, [mergedLatestTrailers, mergedTrendingTrailers]);

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

    // 1. Search in all DB movies (this covers everything in backend)
    dbMovies.forEach(dbMovie => {
      // Find category name for DB movie
      const cat = categories.find(c => c.id === dbMovie.category.toLowerCase()) ||
        (dbMovie.category.toLowerCase() === 'tv-series' ? { name: 'TV Series' } : null);
      addIfMatches(toFrontendMovie(dbMovie), cat?.name || "Movie");
    });

    // 2. Search in search static categories JUST in case they aren't in DB
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
        title={SEO_CONFIG.home.title}
        description={SEO_CONFIG.home.description}
      />

      {/* Animated Edge Glow Effects */}
      <div className="edge-glow" aria-hidden="true" />
      <div className="edge-glow-extra" aria-hidden="true" />

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
      />

      {/* Filter Bar */}
      {!isSearching && (
        <div className="fixed top-16 left-0 right-0 z-40 flex justify-center py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
          <GenreFilter selectedGenre={selectedGenre} onSelectGenre={setSelectedGenre} />
        </div>
      )}

      <main>
        {!isSearching && (
          <Hero
            categoriesCount={9}
            moviesCount={moviesCount}
          />
        )}

        {isSearching ? (
          <div className="pt-24">
            <SearchResults
              results={searchResults}
              searchQuery={searchQuery}
              onPlayTrailer={handlePlayTrailer}
            />
          </div>
        ) : selectedGenre ? (
          <div className="pt-32">
            <div className="container px-4 md:px-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">Genre: {selectedGenre}</h2>
              {genreFilteredMovies.length === 0 ? (
                <p className="text-muted-foreground">No movies found for this genre.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {genreFilteredMovies.map(movie => (
                    <div key={movie.id} onClick={() => handlePlayTrailer(movie)} className="cursor-pointer group relative aspect-[2/3] overflow-hidden rounded-lg bg-muted transition-all hover:scale-105 hover:ring-2 hover:ring-primary/50">
                      <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <h3 className="font-semibold text-white line-clamp-2">{movie.title}</h3>
                        <p className="text-sm text-gray-300">{movie.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div id="categories" className="py-8">
            {/* Recommended Trailers at the top with Glow Effect */}
            <RecommendedSection
              allMovies={allMoviesForRecommended}
              onPlayTrailer={handlePlayTrailer}
              onReviewClick={handleReviewClick}
            />

            {/* Featured Section - Latest & Trending side by side */}
            <FeaturedSection
              latestCategory={mergedLatestTrailers}
              trendingCategory={mergedTrendingTrailers}
              onPlayTrailer={handlePlayTrailer}
              onReviewClick={handleReviewClick}
            />

            {/* Hollywood Section */}
            <CategorySection
              category={hollywoodCategory}
              index={1}
              onPlayTrailer={handlePlayTrailer}
              onReviewClick={handleReviewClick}
            />

            {/* Nollywood Section */}
            <CategorySection
              category={nollywoodCategory}
              index={2}
              onPlayTrailer={handlePlayTrailer}
              onReviewClick={handleReviewClick}
            />

            {/* Bollywood Section */}
            <CategorySection
              category={bollywoodCategory}
              index={3}
              onPlayTrailer={handlePlayTrailer}
              onReviewClick={handleReviewClick}
            />
          </div>
        )}
      </main>

      <Footer />

      {/* Trailer Modal */}
      <TrailerModal
        key={selectedMovie ? `trailer-modal-${selectedMovie.id}` : 'trailer-modal-closed'}
        isOpen={!!selectedMovie}
        onClose={handleCloseTrailer}
        trailerUrl={selectedMovie?.trailerUrl || ""}
        movieTitle={selectedMovie?.title || ""}
        currentMovie={selectedMovie}
        onPlayTrailer={handlePlayTrailer}
      />

      {/* Review Modal */}
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

export default Index;
