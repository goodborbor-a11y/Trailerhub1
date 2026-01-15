import { X, Maximize2, Minimize2, Play } from "lucide-react";
import { useEffect, useState, useMemo, memo } from "react";
import { SocialShare } from "@/components/SocialShare";
import { MovieActions } from "@/components/MovieActions";
import { CommentsFixed } from "@/components/CommentsFixed";
import { Movie, categories, tvSeriesCategory, latestTrailers, trendingTrailers } from "@/data/movies";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TrailerModalProps {
    isOpen: boolean;
    onClose: () => void;
    trailerUrl: string;
    movieTitle: string;
    currentMovie?: Movie | null;
    onPlayTrailer?: (movie: Movie) => void;
}

// --- Helper Functions ---

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

const getAllMovies = (): Movie[] => {
    const allMovies: Movie[] = [];
    allMovies.push(...latestTrailers.movies);
    allMovies.push(...trendingTrailers.movies);
    allMovies.push(...tvSeriesCategory.movies);
    categories.forEach(cat => allMovies.push(...cat.movies));
    return allMovies;
};

const getSimilarMovies = (currentMovie: Movie | null | undefined, count: number = 4): Movie[] => {
    if (!currentMovie) return [];

    const allMovies = getAllMovies();
    let categoryMovies: Movie[] = [];

    // Try to find movies in the same category
    for (const cat of [latestTrailers, trendingTrailers, tvSeriesCategory, ...categories]) {
        if (cat.movies.some(m => m.id === currentMovie.id)) {
            categoryMovies = cat.movies.filter(m => m.id !== currentMovie.id);
            break;
        }
    }

    // Fallback to random movies if not enough in category
    if (categoryMovies.length < count) {
        const otherMovies = allMovies.filter(
            m => m.id !== currentMovie.id && !categoryMovies.some(cm => cm.id === m.id)
        );
        categoryMovies = [...categoryMovies, ...otherMovies];
    }

    return categoryMovies.sort(() => Math.random() - 0.5).slice(0, count);
};

// Safety wrapper for getSimilarMovies
const getSimilarMoviesSafe = (currentMovie: Movie | null | undefined): Movie[] => {
    try {
        if (!currentMovie) return [];
        // Ensure imports are valid before using
        const safeLatest = latestTrailers || { movies: [] };
        const safeTrending = trendingTrailers || { movies: [] };
        const safeTv = tvSeriesCategory || { movies: [] };
        const safeCategories = Array.isArray(categories) ? categories : [];

        const allMovies: Movie[] = [];
        allMovies.push(...safeLatest.movies);
        allMovies.push(...safeTrending.movies);
        allMovies.push(...safeTv.movies);
        safeCategories.forEach(cat => allMovies.push(...cat.movies));

        let categoryMovies: Movie[] = [];
        const catsToCheck = [safeLatest, safeTrending, safeTv, ...safeCategories];

        for (const cat of catsToCheck) {
            if (cat?.movies?.some(m => m.id === currentMovie.id)) {
                categoryMovies = cat.movies.filter(m => m.id !== currentMovie.id);
                break;
            }
        }

        if (categoryMovies.length < 4) {
            const otherMovies = allMovies.filter(
                m => m.id !== currentMovie.id && !categoryMovies.some(cm => cm.id === m.id)
            );
            categoryMovies = [...categoryMovies, ...otherMovies];
        }

        return categoryMovies.sort(() => Math.random() - 0.5).slice(0, 4);
    } catch (e) {
        console.error("Error in getSimilarMovies:", e);
        return [];
    }
};

// --- Component ---

const TrailerModalComponent = ({
    isOpen,
    onClose,
    trailerUrl,
    movieTitle,
    currentMovie,
    onPlayTrailer
}: TrailerModalProps) => {
    const [isWideMode, setIsWideMode] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);


    useEffect(() => {
        if (isOpen) {
            setIframeLoaded(false);
        } else {
            setIsWideMode(false);
        }
    }, [isOpen, currentMovie?.id]);

    // Handle Mobile orientation on Fullscreen
    useEffect(() => {
        if (!isOpen) return;

        const handleFullscreenChange = async () => {
            const isFullscreen = !!document.fullscreenElement;

            // Check if we are on mobile (very rough check for Screen Orientation API support)
            if (isFullscreen && screen.orientation && 'lock' in screen.orientation) {
                try {
                    console.log("[Orientation] Attempting to lock to landscape...");
                    // Lock to landscape when entering fullscreen
                    await (screen.orientation as any).lock('landscape');
                } catch (err) {
                    console.warn("[Orientation] Failed to lock orientation:", err);
                }
            } else if (!isFullscreen && screen.orientation && 'unlock' in screen.orientation) {
                try {
                    console.log("[Orientation] Unlocking orientation...");
                    (screen.orientation as any).unlock();
                } catch (err) {
                    console.warn("[Orientation] Failed to unlock orientation:", err);
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Support Safari/older browsers

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            // Ensure we unlock on unmount if we were locked
            if (screen.orientation && 'unlock' in screen.orientation) {
                try { (screen.orientation as any).unlock(); } catch (e) { }
            }
        };
    }, [isOpen]);

    const embedUrl = useMemo(() => getYouTubeEmbedUrl(trailerUrl), [trailerUrl]);
    const similarMovies = useMemo(() => getSimilarMoviesSafe(currentMovie), [currentMovie]);

    if (!isOpen) return null;

    // Use same scrollable layout for both mobile and desktop
    return (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto bg-black/95 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            style={{ overscrollBehavior: 'contain' }}
        >
            {/* Backdrop used to close on click outside, but valid click targets are above it */}
            <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

            {/* Scrollable Content Wrapper - uses min-height to ensure scroll works */}
            <div className="min-h-full flex flex-col items-center justify-start py-4 md:py-8 px-2 md:px-4 relative z-[101]">
                {/* Modal Content Container */}
                <div
                    className={`relative w-full transition-all duration-300 flex flex-col items-center
                ${isWideMode ? "min-h-screen py-0 max-w-none" : "max-w-5xl"}`}
                >
                    {/* Header Controls */}
                    <div className={`w-full flex items-center justify-between mb-2 md:mb-4 ${isWideMode ? "absolute top-4 left-0 right-0 px-6 z-[1001] pointer-events-none" : ""}`}>
                        {/* Title */}
                        <h2 className={`font-display text-base md:text-lg lg:text-2xl text-white truncate max-w-[60%] ${isWideMode ? "text-shadow-md pointer-events-auto" : ""}`}>
                            {movieTitle}
                        </h2>

                        {/* Buttons */}
                        <div className={`flex items-center gap-2 ${isWideMode ? "pointer-events-auto" : ""}`}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsWideMode(!isWideMode)}
                                className="flex rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            >
                                {isWideMode ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                                {isWideMode ? "Exit Wide" : "Wide Mode"}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full bg-white/10 hover:bg-white/20 text-white h-8 w-8 md:h-10 md:w-10 border border-white/10"
                            >
                                <X className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* iOS Fullscreen Styles - The "Nuclear Option" */}
                    {isWideMode && (
                        <style>{`
                            #ios-player-wrapper {
                                position: fixed !important;
                                z-index: 1000 !important;
                                background-color: black !important;
                            }
                            @media (orientation: landscape) {
                                #ios-player-wrapper {
                                    inset: 0 !important;
                                    width: 100vw !important;
                                    height: 100dvh !important;
                                }
                            }
                            @media (orientation: portrait) {
                                #ios-player-wrapper {
                                    top: 50% !important;
                                    left: 50% !important;
                                    width: 100dvh !important;
                                    height: 100vw !important;
                                    transform: translate(-50%, -50%) rotate(90deg) !important;
                                }
                            }
                        `}</style>
                    )}

                    {/* Video Player */}
                    <div
                        id="ios-player-wrapper"
                        className={`relative bg-black shadow-2xl transition-all duration-300 overflow-hidden
                            ${!isWideMode ? "w-full aspect-video rounded-lg md:rounded-xl ring-1 ring-white/10" : ""}
                        `}
                    >
                        {!iframeLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center text-white/50 animate-pulse">
                                Loading Trailer...
                            </div>
                        )}
                        <iframe
                            src={embedUrl}
                            title={`${movieTitle} trailer`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                            onLoad={() => setIframeLoaded(true)}
                        />
                        {/* Invisible Click-Trap over Native YouTube Fullscreen Button */}
                        {!isWideMode && (
                            <div
                                onClick={() => setIsWideMode(true)}
                                className="absolute bottom-0 right-0 w-16 h-16 md:w-20 md:h-20 z-[1002] cursor-pointer"
                                aria-label="Enter Wide Mode"
                                role="button"
                                style={{
                                    /* Debug: 'rgba(255, 0, 0, 0.3)' to see the hit area, 'transparent' for prod */
                                    backgroundColor: 'transparent'
                                }}
                            />
                        )}
                    </div>

                    {/* Details Section (Hidden in Wide Mode) */}
                    {!isWideMode && (
                        <div className="w-full mt-4 md:mt-6 animate-fade-in">
                            {/* Layout Container */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                                {/* Actions & Share (Mobile: 1st, Desktop: Left Top) */}
                                <div className="order-1 lg:col-span-2 flex flex-wrap items-center justify-start gap-3 md:gap-4">
                                    {currentMovie && <MovieActions movieId={currentMovie.id} />}
                                    <div className="bg-white/5 rounded-full px-3 md:px-4 py-2 border border-white/10">
                                        <SocialShare title={movieTitle} url={trailerUrl} />
                                    </div>
                                </div>

                                {/* Comments (Mobile: 2nd, Desktop: Right Sidebar) */}
                                <div className="order-2 lg:col-span-1 lg:row-span-2">
                                    {currentMovie && (
                                        <div className="bg-white/5 rounded-lg md:rounded-xl border border-white/10 p-3 md:p-4 h-full">
                                            <CommentsFixed movieId={currentMovie.id} movieTitle={movieTitle} />
                                        </div>
                                    )}
                                </div>

                                {/* Similar Trailers (Mobile: 3rd, Desktop: Left Bottom) */}
                                {similarMovies.length > 0 && onPlayTrailer && (
                                    <div className="order-3 lg:col-span-2 space-y-3 md:space-y-4">
                                        <h3 className="text-base md:text-lg font-display text-white border-l-4 border-primary pl-3">
                                            You May Also Like
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                                            {similarMovies.map(movie => (
                                                <div
                                                    key={movie.id}
                                                    className="group relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer ring-1 ring-white/10 hover:ring-primary transition-all"
                                                    onClick={() => onPlayTrailer(movie)}
                                                >
                                                    <img
                                                        src={movie.poster}
                                                        alt={movie.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 md:p-3">
                                                        <div className="flex items-center gap-2 text-primary font-medium text-xs md:text-sm">
                                                            <Play className="fill-current w-3 h-3" />
                                                            Watch Trailer
                                                        </div>
                                                        <p className="text-white text-xs md:text-sm font-medium truncate mt-1">{movie.title}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TrailerModal = memo(TrailerModalComponent);
TrailerModal.displayName = 'TrailerModal';
