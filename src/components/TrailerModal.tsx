import { X, Maximize2, Minimize2, Play, Smartphone, Monitor, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo, useRef, useCallback, memo } from "react";
import { SocialShare } from "@/components/SocialShare";
import { MovieActions } from "@/components/MovieActions";
import { CommentsFixed } from "@/components/CommentsFixed";
import { Button } from "@/components/ui/button";
import { Movie, categories, tvSeriesCategory, latestTrailers, trendingTrailers } from "@/data/movies";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string;
  movieTitle: string;
  currentMovie?: Movie | null;
  onPlayTrailer?: (movie: Movie) => void;
}

const getYouTubeEmbedUrl = (url: string): string => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
  }

  return url;
};

// Get all movies from all categories
const getAllMovies = (): Movie[] => {
  const allMovies: Movie[] = [];
  allMovies.push(...latestTrailers.movies);
  allMovies.push(...trendingTrailers.movies);
  allMovies.push(...tvSeriesCategory.movies);
  categories.forEach(cat => allMovies.push(...cat.movies));
  return allMovies;
};

// Find similar movies (same category or random if not found)
const getSimilarMovies = (currentMovie: Movie | null | undefined, count: number = 4): Movie[] => {
  if (!currentMovie) return [];

  const allMovies = getAllMovies();

  // Find which category the current movie belongs to
  let categoryMovies: Movie[] = [];

  for (const cat of [latestTrailers, trendingTrailers, tvSeriesCategory, ...categories]) {
    if (cat.movies.some(m => m.id === currentMovie.id)) {
      categoryMovies = cat.movies.filter(m => m.id !== currentMovie.id);
      break;
    }
  }

  // If not enough movies in category, add from other categories
  if (categoryMovies.length < count) {
    const otherMovies = allMovies.filter(
      m => m.id !== currentMovie.id && !categoryMovies.some(cm => cm.id === m.id)
    );
    categoryMovies = [...categoryMovies, ...otherMovies];
  }

  // Return shuffled subset
  return categoryMovies.sort(() => Math.random() - 0.5).slice(0, count);
};

const TrailerModalComponent = ({
  isOpen,
  onClose,
  trailerUrl,
  movieTitle,
  currentMovie,
  onPlayTrailer
}: TrailerModalProps) => {
  const [isWideMode, setIsWideMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [youtubeLoaded, setYoutubeLoaded] = useState(false);
  const [youtubeError, setYoutubeError] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMountedRef = useRef(true);

  // Silently handle ad script errors (from browser extensions or external scripts)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorSource = (event.filename || event.message || '').toLowerCase();
      if (
        errorSource.includes('googlesyndication') ||
        errorSource.includes('doubleclick') ||
        errorSource.includes('pagemad') ||
        errorSource.includes('googletagservices') ||
        errorSource.includes('gpt') ||
        errorSource.includes('pubads') ||
        errorSource.includes('ads') ||
        errorSource.includes('advertisement')
      ) {
        // Silently ignore ad script errors - they shouldn't crash the UI
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || '').toLowerCase();
      if (
        reason.includes('googlesyndication') ||
        reason.includes('doubleclick') ||
        reason.includes('pagemad') ||
        reason.includes('googletagservices') ||
        reason.includes('gpt') ||
        reason.includes('pubads') ||
        reason.includes('ads')
      ) {
        // Silently ignore ad-related promise rejections
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Track mount state and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Diagnostics: Log modal mount/unmount
  useEffect(() => {
    if (isOpen) {
      console.log('[TrailerModal] Mounted', {
        movieId: currentMovie?.id,
        movieTitle,
        trailerUrl
      });
    }
    return () => {
      if (isOpen) {
        console.log('[TrailerModal] Unmounting', { movieId: currentMovie?.id });
      }
    };
  }, [isOpen, currentMovie?.id, movieTitle, trailerUrl]);

  const scrollUp = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      console.error('Scroll container ref is null');
      return;
    }

    const scrollAmount = 300;
    const currentScroll = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const isScrollable = container.scrollHeight > container.clientHeight;

    if (!isScrollable) {
      console.warn('Container is not scrollable:', {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight
      });
      return;
    }

    const newScroll = Math.max(0, currentScroll - scrollAmount);

    // Try multiple methods to ensure scrolling works
    container.scrollTop = newScroll; // Direct assignment (immediate)
    container.scrollTo({ top: newScroll, behavior: 'smooth' }); // Smooth scroll

    // Verify scroll happened
    setTimeout(() => {
      console.log('Scroll up executed:', {
        currentScroll,
        newScroll,
        actualScrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        maxScroll,
        isScrollable,
        didScroll: container.scrollTop !== currentScroll
      });
    }, 100);
  }, []);

  const scrollDown = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      console.error('Scroll container ref is null');
      return;
    }

    const scrollAmount = 300;
    const currentScroll = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const isScrollable = container.scrollHeight > container.clientHeight;

    if (!isScrollable) {
      console.warn('Container is not scrollable:', {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight
      });
      return;
    }

    const newScroll = Math.min(maxScroll, currentScroll + scrollAmount);

    // Try multiple methods to ensure scrolling works
    container.scrollTop = newScroll; // Direct assignment (immediate)
    container.scrollTo({ top: newScroll, behavior: 'smooth' }); // Smooth scroll

    // Verify scroll happened
    setTimeout(() => {
      console.log('Scroll down executed:', {
        currentScroll,
        newScroll,
        actualScrollTop: container.scrollTop,
        maxScroll,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        isScrollable,
        didScroll: container.scrollTop !== currentScroll
      });
    }, 100);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
        // Try to lock screen orientation to landscape on mobile
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {
            // Orientation lock not supported or failed - that's ok
          }
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        // Unlock orientation
        if (screen.orientation && 'unlock' in screen.orientation) {
          try {
            (screen.orientation as any).unlock();
          } catch (e) {
            // Orientation unlock not supported - that's ok
          }
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Stable close handler
  const handleClose = useCallback(() => {
    console.log('[TrailerModal] Closing', { movieId: currentMovie?.id });
    onClose();
  }, [onClose, currentMovie?.id]);

  // Stable wide mode toggle
  const handleToggleWideMode = useCallback(() => {
    setIsWideMode(prev => !prev);
  }, []);

  // YouTube iframe load handlers - simplified
  const handleIframeLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log('[TrailerModal] YouTube iframe loaded', { movieId: currentMovie?.id });
    setYoutubeLoaded(true);
    setYoutubeError(false);
  }, [currentMovie?.id]);

  const handleIframeError = useCallback(() => {
    if (!isMountedRef.current) return;
    console.warn('[TrailerModal] YouTube iframe error event', { movieId: currentMovie?.id });
    setYoutubeError(true);
    setYoutubeLoaded(false);
  }, [currentMovie?.id]);

  // Auto-hide loading overlay immediately to prevent blank screen
  // YouTube embeds sometimes don't fire onLoad reliably, so we auto-hide very quickly
  useEffect(() => {
    if (!isOpen || youtubeLoaded || youtubeError) return;

    // Hide loading overlay after 300ms to prevent blank screen
    // The iframe will be visible immediately so content shows
    const fallbackTimeout = setTimeout(() => {
      if (isMountedRef.current && !youtubeLoaded && !youtubeError) {
        console.log('[TrailerModal] Auto-hiding loading overlay to prevent blank screen', { movieId: currentMovie?.id });
        setYoutubeLoaded(true);
      }
    }, 300); // 300ms - very fast to prevent blank screen

    return () => clearTimeout(fallbackTimeout);
  }, [isOpen, youtubeLoaded, youtubeError, currentMovie?.id]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const similarMovies = useMemo(() => getSimilarMovies(currentMovie), [currentMovie]);

  // Prevent "F" key from triggering fullscreen when typing in comment inputs
  // Blocks fullscreen ONLY - allows normal typing of "f" in inputs
  useEffect(() => {
    const blockFullscreenOnly = (e: KeyboardEvent) => {
      // Check if typing in input/textarea
      const isTypingInComment =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (document.activeElement instanceof HTMLInputElement) ||
        (document.activeElement instanceof HTMLTextAreaElement);

      // Only block fullscreen if typing in comment input AND key is "f" (case-insensitive)
      // AND no modifier keys (to allow Ctrl+F, Cmd+F, etc.)
      if (
        isTypingInComment &&
        e.key.toLowerCase() === 'f' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        // Stop propagation to prevent fullscreen handler from seeing it
        // BUT do NOT prevent default - allow normal typing
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    if (isOpen) {
      // Use capture phase to intercept BEFORE fullscreen handler sees it
      document.addEventListener('keydown', blockFullscreenOnly, { capture: true });
    }

    return () => {
      if (isOpen) {
        document.removeEventListener('keydown', blockFullscreenOnly, { capture: true });
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "f" || e.key === "F") handleToggleWideMode();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose, handleToggleWideMode]);

  // Reset state on close/open
  useEffect(() => {
    if (!isOpen) {
      setIsWideMode(false);
      setYoutubeLoaded(false);
      setYoutubeError(false);
    } else {
      // Reset YouTube state when opening new modal
      setYoutubeLoaded(false);
      setYoutubeError(false);
    }
  }, [isOpen, currentMovie?.id]);

  // Debug: Log scroll container info when modal opens
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      console.log('Scroll container initialized:', {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
        isScrollable: container.scrollHeight > container.clientHeight,
        element: container
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const embedUrl = getYouTubeEmbedUrl(trailerUrl);

  // Diagnostics: Log embed URL
  useEffect(() => {
    if (isOpen) {
      console.log('[TrailerModal] Embed URL generated', {
        originalUrl: trailerUrl,
        embedUrl,
        movieId: currentMovie?.id
      });
    }
  }, [isOpen, trailerUrl, embedUrl, currentMovie?.id]);

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar"
      role="dialog"
      aria-modal="true"
      aria-label={`${movieTitle} trailer`}
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34, 197, 94, 0.3) transparent' }}
    >
      {/* Dark overlay backdrop - positioned behind content */}
      <div
        className="fixed inset-0 bg-black/95 animate-fade-in z-[98]"
        onClick={handleClose}
        onWheel={(e) => {
          // Forward wheel events to scroll container
          if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollTop += e.deltaY;
            e.preventDefault();
          }
        }}
        style={{ pointerEvents: 'auto' }}
        aria-hidden="true"
      />

      {/* Scrollable content area */}
      <div
        className="min-h-full flex flex-col items-center justify-start py-4 sm:py-8 px-4 relative z-[100]"
      >
        {/* Modal content */}
        <div
          className={`relative z-[101] animate-scale-in transition-all duration-300 ${isWideMode
            ? "w-[100vw] h-[100vh] max-w-none mx-0 fixed inset-0"
            : "w-full max-w-5xl"
            }`}
        >
          {/* Controls bar - positioned above video on mobile */}
          <div className={`flex items-center justify-between w-full mb-3 ${isWideMode ? "absolute top-4 left-0 right-0 px-6 z-10" : ""
            }`}>
            {/* Movie title */}
            <h2 className={`font-display text-lg sm:text-2xl text-white truncate max-w-[50%] ${isWideMode ? "text-shadow-lg" : ""
              }`}>
              {movieTitle}
            </h2>

            {/* Control buttons */}
            <div className="flex items-center gap-2">
              {/* Wide mode toggle */}
              <button
                onClick={handleToggleWideMode}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/20 border border-primary/30 text-white hover:bg-primary/30 transition-colors"
                aria-label={isWideMode ? "Exit wide mode" : "Enter wide mode"}
                title={isWideMode ? "Exit wide mode (F)" : "Wide mode (F)"}
              >
                {isWideMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {isWideMode ? "Exit" : "Wide"}
                </span>
              </button>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                aria-label="Close trailer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Video container */}
          <div
            ref={videoContainerRef}
            className={`relative overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 transition-all duration-300 ${isWideMode
              ? "w-full h-full rounded-none"
              : "aspect-video w-full rounded-xl"
              } ${isFullscreen ? "fullscreen-video" : ""}`}
          >
            {youtubeError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white p-4">
                  <p className="text-lg font-semibold mb-2">Video unavailable</p>
                  <p className="text-sm text-white/70">The trailer could not be loaded. Please try again later.</p>
                </div>
              </div>
            ) : (
              <>
                {!youtubeLoaded && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                    style={{
                      opacity: youtubeLoaded ? 0 : 1,
                      transition: 'opacity 0.2s ease-in-out',
                      display: youtubeLoaded ? 'none' : 'flex',
                      background: 'transparent'
                    }}
                  >
                    <div className="text-white text-sm drop-shadow-lg">Loading video...</div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  key={`youtube-${currentMovie?.id || 'default'}-${embedUrl}`}
                  src={embedUrl}
                  title={`${movieTitle} trailer`}
                  className="absolute inset-0 h-full w-full z-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  style={{
                    opacity: 1,
                    transition: 'opacity 0.3s ease-in-out',
                    visibility: 'visible'
                  }}
                />
              </>
            )}
          </div>

          {/* Social Share and Similar Movies - only in normal mode */}
          {!isWideMode && (
            <>
              {/* Actions and Social Share */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {currentMovie && (
                  <MovieActions
                    movieId={currentMovie.id}
                  />
                )}
                <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <SocialShare title={movieTitle} url={trailerUrl} />
                </div>
              </div>

              {/* Comments Section - Memoized with stable key */}
              {currentMovie && (
                <div className="w-full pt-8 mt-8 border-t border-white/10 dark:border-white/5">
                  <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <CommentsFixed
                      movieId={currentMovie.id}
                      movieTitle={movieTitle}
                    />
                  </div>
                </div>
              )}    {/* Similar Movies Section */}
              {similarMovies.length > 0 && onPlayTrailer && (
                <div className="mt-8">
                  <h3 className="text-lg font-display text-white mb-4">Similar Trailers</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {similarMovies.map((movie) => (
                      <button
                        key={`similar-${movie.id}`}
                        onClick={() => onPlayTrailer(movie)}
                        className="group relative rounded-lg overflow-hidden aspect-[2/3] bg-white/5 hover:ring-2 hover:ring-primary transition-all"
                      >
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-primary" />
                            <span className="text-xs text-white font-medium truncate">{movie.title}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scroll controls on the right side */}
      {!isWideMode && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[101] flex flex-col gap-2 pointer-events-none">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Scroll up button clicked');
              scrollUp();
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/30 text-white hover:bg-primary/30 transition-colors backdrop-blur-sm pointer-events-auto cursor-pointer"
            aria-label="Scroll up"
            title="Scroll up"
            type="button"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Scroll down button clicked');
              scrollDown();
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/30 text-white hover:bg-primary/30 transition-colors backdrop-blur-sm pointer-events-auto cursor-pointer"
            aria-label="Scroll down"
            title="Scroll down"
            type="button"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}

    </div>
  );
};

// Memoize component with stable props comparison
export const TrailerModal = memo(TrailerModalComponent, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.trailerUrl === nextProps.trailerUrl &&
    prevProps.movieTitle === nextProps.movieTitle &&
    prevProps.currentMovie?.id === nextProps.currentMovie?.id &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onPlayTrailer === nextProps.onPlayTrailer
  );
});

TrailerModal.displayName = 'TrailerModal';
