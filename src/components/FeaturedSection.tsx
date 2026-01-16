import { Category, Movie } from "@/data/movies";
import { MovieCard } from "./MovieCard";
import { Flame, Clock } from "lucide-react";

interface MovieRating {
  average: number;
  count: number;
}

interface FeaturedSectionProps {
  latestCategory: Category;
  trendingCategory: Category;
  onPlayTrailer?: (movie: Movie) => void;
  onReviewClick?: (movie: Movie) => void;
  getMovieRating?: (movieId: string) => MovieRating | null;
}

export const FeaturedSection = ({ latestCategory, trendingCategory, onPlayTrailer, onReviewClick, getMovieRating }: FeaturedSectionProps) => {
  return (
    <section className="animate-fade-in py-8">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Trending Trailers */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                <Flame className="h-4 w-4 text-destructive" />
              </div>
              <h2 className="font-display text-2xl tracking-wide text-foreground md:text-3xl">
                {trendingCategory.name}
              </h2>
            </div>
            <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0">
              {trendingCategory.movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onPlayTrailer={onPlayTrailer}
                  onReviewClick={onReviewClick}
                  rating={getMovieRating?.(movie.id)}
                />
              ))}
            </div>
          </div>

          {/* Latest Trailers */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-display text-2xl tracking-wide text-foreground md:text-3xl">
                {latestCategory.name}
              </h2>
            </div>
            <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0">
              {latestCategory.movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onPlayTrailer={onPlayTrailer}
                  onReviewClick={onReviewClick}
                  rating={getMovieRating?.(movie.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
