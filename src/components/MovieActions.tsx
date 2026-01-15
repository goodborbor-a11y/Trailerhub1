import { useState, useEffect } from 'react';
import { Heart, Bookmark, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { getOrCreateGuestIdentifier } from '@/lib/guestIdentifier';
import { useGuestStorage } from '@/hooks/useGuestStorage';
import { cn } from '@/lib/utils';

interface MovieActionsProps {
  movieId: string;
  onReviewClick?: () => void;
  variant?: 'default' | 'compact';
}

export const MovieActions = ({ movieId, onReviewClick, variant = 'default' }: MovieActionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const guestStorage = useGuestStorage();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWatchlistStatus();
    } else {
      // Use guest storage
      setIsInWatchlist(guestStorage.isInWatchlist(movieId));
      setIsFavorite(guestStorage.isFavorite(movieId));
    }
  }, [user, movieId, guestStorage.watchlist, guestStorage.favorites]);

  const fetchWatchlistStatus = async () => {
    if (!user) return;

    try {
      const result = await api.getWatchlist();
      
      if (result.error) {
        console.error('Error fetching watchlist status:', result.error);
        setIsInWatchlist(false);
        setIsFavorite(false);
        return;
      }

      const watchlistData = result.data?.watchlist || [];
      const item = watchlistData.find((w: any) => w.movie_id === movieId);
      
      if (item) {
        setIsInWatchlist(true);
        setIsFavorite(item.is_favorite || false);
      } else {
        setIsInWatchlist(false);
        setIsFavorite(false);
      }
    } catch (error) {
      console.error('Error fetching watchlist status:', error);
      setIsInWatchlist(false);
      setIsFavorite(false);
    }
  };

  const toggleWatchlist = async () => {
    setLoading(true);
    
    if (!user) {
      // Guest mode - use localStorage
      if (isInWatchlist) {
        guestStorage.removeFromWatchlist(movieId);
        setIsInWatchlist(false);
        setIsFavorite(false);
        toast({ title: 'Removed from watchlist' });
      } else {
        guestStorage.addToWatchlist(movieId);
        setIsInWatchlist(true);
        toast({ title: 'Added to watchlist' });
      }
      setLoading(false);
      return;
    }
    
    try {
      console.log('Toggle watchlist:', { movieId, isInWatchlist, hasUser: !!user });
      
      if (isInWatchlist) {
        const result = await api.removeFromWatchlist(movieId);
        console.log('Remove from watchlist result:', result);
        if (result.error) {
          console.error('Remove watchlist error:', result.error);
          throw new Error(result.error);
        }
        setIsInWatchlist(false);
        setIsFavorite(false);
        toast({ title: 'Removed from watchlist' });
      } else {
        const result = await api.addToWatchlist(movieId, false);
        console.log('Add to watchlist result:', result);
        if (result.error) {
          console.error('Add watchlist error:', result.error);
          throw new Error(result.error);
        }
        setIsInWatchlist(true);
        toast({ title: 'Added to watchlist' });
      }
    } catch (error: any) {
      console.error('Watchlist toggle error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Something went wrong.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    setLoading(true);
    
    if (!user) {
      // Guest mode - use localStorage
      guestStorage.toggleFavorite(movieId);
      const nowFavorite = !isFavorite;
      setIsFavorite(nowFavorite);
      toast({ title: nowFavorite ? 'Added to favorites' : 'Removed from favorites' });
      setLoading(false);
      return;
    }
    
    try {
      console.log('Toggle favorite:', { movieId, isFavorite, isInWatchlist, hasUser: !!user });
      
      if (!isInWatchlist) {
        const result = await api.addToWatchlist(movieId, true);
        console.log('Add to favorites result:', result);
        if (result.error) {
          console.error('Add favorite error:', result.error);
          throw new Error(result.error);
        }
        setIsInWatchlist(true);
        setIsFavorite(true);
        toast({ title: 'Added to favorites' });
      } else {
        const newFavorite = !isFavorite;
        const result = await api.addToWatchlist(movieId, newFavorite);
        console.log('Update favorite result:', result);
        if (result.error) {
          console.error('Update favorite error:', result.error);
          throw new Error(result.error);
        }
        setIsFavorite(newFavorite);
        toast({ title: newFavorite ? 'Added to favorites' : 'Removed from favorites' });
      }
    } catch (error: any) {
      console.error('Favorite toggle error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Something went wrong.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = () => {
    onReviewClick?.();
  };

  const isCompact = variant === 'compact';

  return (
    <div className={cn('flex gap-2', isCompact && 'gap-1')}>
      <Button
        variant="outline"
        size={isCompact ? 'icon' : 'sm'}
        onClick={toggleFavorite}
        disabled={loading}
        className={cn(
          'border-primary/30 hover:bg-primary/10',
          isFavorite && 'bg-primary/20 border-primary'
        )}
      >
        <Heart className={cn('h-4 w-4', isFavorite && 'fill-primary text-primary')} />
        {!isCompact && <span className="ml-1">Favorite</span>}
      </Button>
      
      <Button
        variant="outline"
        size={isCompact ? 'icon' : 'sm'}
        onClick={toggleWatchlist}
        disabled={loading}
        className={cn(
          'border-primary/30 hover:bg-primary/10',
          isInWatchlist && 'bg-primary/20 border-primary'
        )}
      >
        <Bookmark className={cn('h-4 w-4', isInWatchlist && 'fill-primary text-primary')} />
        {!isCompact && <span className="ml-1">Watchlist</span>}
      </Button>

      {onReviewClick && (
        <Button
          variant="outline"
          size={isCompact ? 'icon' : 'sm'}
          onClick={handleReviewClick}
          className="border-primary/30 hover:bg-primary/10"
        >
          <MessageSquare className="h-4 w-4" />
          {!isCompact && <span className="ml-1">Review</span>}
        </Button>
      )}
    </div>
  );
};
