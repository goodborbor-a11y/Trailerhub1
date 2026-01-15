import { useState, useMemo, useCallback } from "react";
import { Movie, Category } from "@/data/movies";
import { MovieCard } from "./MovieCard";
import { Sparkles, RefreshCw } from "lucide-react";

interface MovieRating {
  average: number;
  count: number;
}

interface RecommendedSectionProps {
  allMovies: Movie[];
  onPlayTrailer?: (movie: Movie) => void;
  onReviewClick?: (movie: Movie) => void;
  getMovieRating?: (movieId: string) => MovieRating | null;
}

export const RecommendedSection = ({ 
  allMovies, 
  onPlayTrailer, 
  onReviewClick, 
  getMovieRating 
}: RecommendedSectionProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get 4 random movies from all movies
  const recommendedMovies = useMemo(() => {
    const movies = [...allMovies];
    // Shuffle using Fisher-Yates algorithm
    for (let i = movies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [movies[i], movies[j]] = [movies[j], movies[i]];
    }
    return movies.slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMovies, refreshKey]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 300);
  }, []);

  if (allMovies.length === 0) return null;

  return (
    <section className="relative py-10 overflow-hidden">
      {/* Purple/Magenta glowing background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[400px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse-glow" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] rounded-full bg-fuchsia-600/15 blur-[80px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container relative px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sparkles className="h-10 w-10 text-fuchsia-500" />
            <div>
              <h2 className="font-display text-2xl md:text-3xl tracking-wider text-fuchsia-400 uppercase">
                Recommended Trailers
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Trending and featured trailers you might enjoy
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw 
              className={`h-5 w-5 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'hover:rotate-180'}`} 
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Movies grid - 4 columns on desktop */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
        >
          {recommendedMovies.map((movie, index) => (
            <div
              key={`${movie.id}-${refreshKey}`}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <MovieCard
                movie={movie}
                onPlayTrailer={onPlayTrailer}
                onReviewClick={onReviewClick}
                rating={getMovieRating?.(movie.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
