import { ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { Category, Movie } from "@/data/movies";
import { MovieCard } from "./MovieCard";
import { YearFilter } from "./YearFilter";

interface MovieRating {
  average: number;
  count: number;
}

interface CategorySectionProps {
  category: Category;
  index: number;
  onPlayTrailer?: (movie: Movie) => void;
  onReviewClick?: (movie: Movie) => void;
  getMovieRating?: (movieId: string) => MovieRating | null;
}

export const CategorySection = ({ category, index, onPlayTrailer, onReviewClick, getMovieRating }: CategorySectionProps) => {
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const years = useMemo(() => category.movies.map((m) => m.year), [category.movies]);

  const filteredMovies = useMemo(() => {
    if (selectedYear === "all") return category.movies;
    return category.movies.filter((m) => m.year.toString() === selectedYear);
  }, [category.movies, selectedYear]);

  return (
    <section
      id={category.id}
      className="animate-fade-in py-8"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="container px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <h2 className="font-display text-3xl tracking-wide text-foreground md:text-4xl">
              {category.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <YearFilter 
              years={years} 
              selectedYear={selectedYear} 
              onYearChange={setSelectedYear} 
            />
            <button className="group flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80">
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:gap-5">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                onPlayTrailer={onPlayTrailer} 
                onReviewClick={onReviewClick}
                rating={getMovieRating?.(movie.id)}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-8">No trailers found for {selectedYear}</p>
          )}
        </div>
      </div>
    </section>
  );
};
