import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useGuestStorage } from '@/hooks/useGuestStorage';
import { MovieCard } from '@/components/MovieCard';
import { TrailerModal } from '@/components/TrailerModal';
import { SEOHead, SEO_CONFIG } from '@/components/SEOHead';
import { categories, latestTrailers, trendingTrailers, tvSeriesCategory, Movie } from '@/data/movies';

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const guestStorage = useGuestStorage();
  const [favoriteItems, setFavoriteItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else if (!authLoading) {
      // Guest mode - load from localStorage
      loadGuestFavorites();
    }
  }, [user, authLoading, guestStorage.favorites]);

  const getAllMovies = (): Movie[] => {
    const allMovies: Movie[] = [
      ...latestTrailers.movies,
      ...trendingTrailers.movies,
      ...tvSeriesCategory.movies,
    ];
    categories.forEach(cat => allMovies.push(...cat.movies));
    return allMovies;
  };

  const loadGuestFavorites = () => {
    const allMovies = getAllMovies();
    const movies = guestStorage.favorites
      .map(id => allMovies.find(m => m.id === id))
      .filter((m): m is Movie => m !== undefined);
    setFavoriteItems(movies);
    setLoading(false);
  };

  const fetchFavorites = async () => {
    if (!user) {
      // For guests, use localStorage (already handled in loadGuestFavorites)
      return;
    }
    
    try {
      const result = await api.getWatchlist();
      
      if (result.error) {
        console.error('Error fetching favorites:', result.error);
        setFavoriteItems([]);
        setLoading(false);
        return;
      }

      const watchlistData = result.data?.watchlist || [];
      // Filter for favorites only
      const favoritesData = watchlistData.filter((item: any) => item.is_favorite === true);
      
      const allMovies = getAllMovies();
      const movies = favoritesData
        .map((item: any) => allMovies.find(m => m.id === item.movie_id))
        .filter((m): m is Movie => m !== undefined);
      setFavoriteItems(movies);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavoriteItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={SEO_CONFIG.favorites.title}
        description={SEO_CONFIG.favorites.description}
      />
      
      <div className="edge-glow" aria-hidden="true" />
      <div className="edge-glow-extra" aria-hidden="true" />

      <div className="container px-4 py-8 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="font-display text-4xl tracking-wide">MY FAVORITES</h1>
        </div>

        {!user && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            Your favorites are saved locally. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>Sign in</Button> to sync across devices.
          </div>
        )}

        {favoriteItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-4">
              Mark movies as favorites to see them here!
            </p>
            <Button onClick={() => navigate('/')} className="bg-gradient-button">
              Browse Movies
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favoriteItems.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onPlayTrailer={setSelectedMovie}
              />
            ))}
          </div>
        )}
      </div>

      <TrailerModal
        key={selectedMovie ? `trailer-modal-${selectedMovie.id}` : 'trailer-modal-closed'}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        trailerUrl={selectedMovie?.trailerUrl || ''}
        movieTitle={selectedMovie?.title || ''}
        currentMovie={selectedMovie}
        onPlayTrailer={setSelectedMovie}
      />
    </div>
  );
};

export default Favorites;
