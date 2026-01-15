import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';

interface Rating {
  movie_id: string;
  rating: number;
}

interface MovieRating {
  average: number;
  count: number;
}

export const useMovieRatings = () => {
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      // Note: This is a simplified version. In production, you'd want a stats endpoint
      // For now, we'll need to fetch ratings per movie as needed
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setLoading(false);
    }
  };

  const getMovieRating = async (movieId: string): Promise<MovieRating | null> => {
    try {
      const result = await api.getMovieRatings(movieId);
      if (result.error || !result.data?.ratings) {
        return null;
      }
      
      const ratings = result.data.ratings;
      if (ratings.length === 0) {
        return null;
      }
      
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / ratings.length;
      
      return {
        average: Math.round(average * 10) / 10, // Round to 1 decimal
        count: ratings.length,
      };
    } catch (error) {
      console.error('Error getting movie rating:', error);
      return null;
    }
  };

  const movieRatings = useMemo(() => {
    // This will be populated as ratings are fetched
    return new Map<string, MovieRating>();
  }, []);

  return { movieRatings, getMovieRating, loading, refetch: fetchRatings };
};
