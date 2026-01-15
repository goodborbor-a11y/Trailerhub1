import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_KEY = 'guest_watchlist';
const FAVORITES_KEY = 'guest_favorites';
const REVIEWS_KEY = 'guest_reviews';

interface GuestReview {
  movieId: string;
  rating: number;
  review: string;
  createdAt: string;
}

export const useGuestStorage = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reviews, setReviews] = useState<GuestReview[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem(WATCHLIST_KEY);
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      const storedReviews = localStorage.getItem(REVIEWS_KEY);

      if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      if (storedReviews) setReviews(JSON.parse(storedReviews));
    } catch (error) {
      console.error('Error loading guest storage:', error);
    }
  }, []);

  // Watchlist operations
  const isInWatchlist = useCallback((movieId: string) => watchlist.includes(movieId), [watchlist]);

  const addToWatchlist = useCallback((movieId: string) => {
    setWatchlist(prev => {
      if (prev.includes(movieId)) return prev;
      const updated = [...prev, movieId];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromWatchlist = useCallback((movieId: string) => {
    setWatchlist(prev => {
      const updated = prev.filter(id => id !== movieId);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
    // Also remove from favorites if present
    setFavorites(prev => {
      const updated = prev.filter(id => id !== movieId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Favorites operations
  const isFavorite = useCallback((movieId: string) => favorites.includes(movieId), [favorites]);

  const toggleFavorite = useCallback((movieId: string) => {
    setFavorites(prev => {
      let updated: string[];
      if (prev.includes(movieId)) {
        updated = prev.filter(id => id !== movieId);
      } else {
        updated = [...prev, movieId];
        // Also add to watchlist if not present
        setWatchlist(wl => {
          if (!wl.includes(movieId)) {
            const updatedWl = [...wl, movieId];
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedWl));
            return updatedWl;
          }
          return wl;
        });
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Review operations
  const getReview = useCallback((movieId: string) => {
    return reviews.find(r => r.movieId === movieId);
  }, [reviews]);

  const saveReview = useCallback((movieId: string, rating: number, review: string) => {
    setReviews(prev => {
      const existing = prev.findIndex(r => r.movieId === movieId);
      let updated: GuestReview[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = { movieId, rating, review, createdAt: prev[existing].createdAt };
      } else {
        updated = [...prev, { movieId, rating, review, createdAt: new Date().toISOString() }];
      }
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteReview = useCallback((movieId: string) => {
    setReviews(prev => {
      const updated = prev.filter(r => r.movieId !== movieId);
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setWatchlist([]);
    setFavorites([]);
    setReviews([]);
    localStorage.removeItem(WATCHLIST_KEY);
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(REVIEWS_KEY);
  }, []);

  return {
    // Watchlist
    watchlist,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    // Favorites
    favorites,
    isFavorite,
    toggleFavorite,
    // Reviews
    reviews,
    getReview,
    saveReview,
    deleteReview,
    // Utility
    clearAll,
  };
};
