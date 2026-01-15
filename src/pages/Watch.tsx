import { useEffect, useState, useRef, Component, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrailerModal } from "@/components/TrailerModalRebuilt";
import { Movie, Category, categories, latestTrailers, trendingTrailers, tvSeriesCategory, findStaticMovie } from "@/data/movies";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toFrontendMovie, DatabaseMovie } from "@/hooks/useMovies";

// Simple Error Boundary to catch React errors
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[Watch Error Boundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Validate trailer URL - must be non-empty and look like a valid YouTube URL
const isValidTrailerUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }

  // Check for YouTube URL patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  return youtubePatterns.some(pattern => pattern.test(url.trim()));
};

// Find static movie synchronously
// Now imported from @/data/movies

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // For static movies, do a synchronous lookup immediately
  const staticMovie = id ? findStaticMovie(id) : null;

  const [movie, setMovie] = useState<Movie | null>(staticMovie);
  const [loading, setLoading] = useState(!staticMovie);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Main effect to fetch/find movie
  useEffect(() => {
    if (!id) {
      setError("No trailer ID provided");
      setLoading(false);
      return;
    }

    const loadMovie = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Try static movie first (fastest)
        const staticFound = findStaticMovie(id);

        // 2. Try API if not found or if it looks like a DB ID
        if (!staticFound || id.startsWith('db-')) {
          console.log("[Watch] Fetching movie from API:", id);
          const result = await api.getMovie(id);

          if (result.data && result.data.movie) {
            const movieData = toFrontendMovie(result.data.movie as DatabaseMovie);
            setMovie(movieData);
            setLoading(false);
            return;
          } else if (result.error) {
            console.warn("[Watch] API fetch failed:", result.error);
            // Fallback to static if API fails but we had a static match
            if (staticFound) {
              setMovie(staticFound);
              setLoading(false);
              return;
            }
          }
        }

        // 3. Use static if available and no API result
        if (staticFound) {
          if (!isValidTrailerUrl(staticFound.trailerUrl)) {
            console.error("[Watch] Static movie has invalid trailer URL:", staticFound.trailerUrl);
            setError("Trailer not available");
          } else {
            console.log("[Watch] Found static movie:", staticFound.title);
            setMovie(staticFound);
          }
          setLoading(false);
          return;
        }

        // 4. Truly not found
        console.warn("[Watch] Movie not found in static or API data:", id);
        setError("Trailer not found");
      } catch (err: any) {
        console.error("[Watch] Error loading movie:", err);
        setError("Error loading trailer");
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [id]);

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  const handleGoHome = () => {
    navigate("/");
  };

  // Auto-redirect after 5 seconds if error
  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          navigate("/");
        }
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [error, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show static error message
  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-display text-foreground mb-4">
            Trailer Not Available
          </h1>
          <p className="text-muted-foreground mb-6">
            {error || "Sorry, this trailer is no longer available or doesn't exist."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleGoHome} variant="default">
              Go to Homepage
            </Button>
            <Button onClick={handleClose} variant="outline">
              Go Back
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Redirecting to homepage in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  // Final validation before rendering TrailerModal
  if (!isValidTrailerUrl(movie.trailerUrl)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-display text-foreground mb-4">
            Trailer Not Available
          </h1>
          <p className="text-muted-foreground mb-6">
            Sorry, this trailer is no longer available or doesn't exist.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleGoHome} variant="default">
              Go to Homepage
            </Button>
            <Button onClick={handleClose} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Debug render
  console.log("[Watch] Rendering TrailerModal for:", movie.title);

  const errorFallback = (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-display text-foreground mb-4">
          Something Went Wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          An error occurred while loading the trailer.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleGoHome} variant="default">
            Go to Homepage
          </Button>
          <Button onClick={handleClose} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <TrailerModal
        key={`trailer-modal-${movie.id}`}
        isOpen={true}
        onClose={handleClose}
        trailerUrl={movie.trailerUrl}
        movieTitle={movie.title}
        currentMovie={movie}
        onPlayTrailer={(nextMovie) => {
          navigate(`/watch/${nextMovie.id}`);
        }}
      />
    </ErrorBoundary>
  );
};

export default Watch;
