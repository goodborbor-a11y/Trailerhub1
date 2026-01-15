import { Play, MessageSquare, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Movie } from "@/data/movies";
import { Button } from "@/components/ui/button";

interface MovieCardProps {
  movie: Movie;
  onPlayTrailer?: (movie: Movie) => void;
  onReviewClick?: (movie: Movie) => void;
  rating?: { average: number; count: number } | null;
}

export const MovieCard = ({ movie, onPlayTrailer, onReviewClick, rating }: MovieCardProps) => {
  const handleReviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReviewClick?.(movie);
  };

  return (
    <Link
      to={`/watch/${movie.id}`}
      className="movie-card group block flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] cursor-pointer"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
        <img
          src={movie.poster}
          alt={`${movie.title} poster`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/300x450/1a1a2e/10b981?text=${encodeURIComponent(movie.title)}`;
          }}
        />

        {/* Overlay */}
        <div className="movie-overlay flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-primary p-3 transition-transform duration-300 group-hover:scale-110">
            <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Watch Trailer</span>
        </div>

        {/* Year badge */}
        <div className="absolute right-3 top-3 rounded-lg border border-primary bg-background px-3 py-1 text-xs font-semibold text-primary">
          {movie.year}
        </div>

        {/* Rating badge */}
        {rating && rating.count > 0 && (
          <div className="absolute left-3 bottom-3 flex items-center gap-1 rounded-lg bg-background/90 backdrop-blur-sm px-2 py-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {rating.average.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({rating.count})
            </span>
          </div>
        )}

        {/* Review button removed as per request */}
      </div>

      {/* Title */}
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
        {movie.title}
      </h3>
    </Link>
  );
};
