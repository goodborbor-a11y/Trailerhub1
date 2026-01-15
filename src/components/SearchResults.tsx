import { MovieCard } from "@/components/MovieCard";
import { Movie } from "@/data/movies";

interface SearchResultsProps {
  results: { movie: Movie; categoryName: string }[];
  searchQuery: string;
  onPlayTrailer?: (movie: Movie) => void;
}

export const SearchResults = ({ results, searchQuery, onPlayTrailer }: SearchResultsProps) => {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-2xl font-display text-muted-foreground">No movies found</p>
        <p className="mt-2 text-muted-foreground">
          No results for "<span className="text-foreground">{searchQuery}</span>"
        </p>
      </div>
    );
  }

  return (
    <section className="px-4 py-8 md:px-6">
      <div className="container">
        <h2 className="mb-6 font-display text-2xl">
          Search Results <span className="text-muted-foreground">({results.length})</span>
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map(({ movie, categoryName }) => (
            <div key={movie.id} className="relative">
              <MovieCard movie={movie} onPlayTrailer={onPlayTrailer} />
              <span className="absolute -top-2 left-2 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {categoryName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
