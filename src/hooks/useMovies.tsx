import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Movie, Category, findStaticMovie } from '@/data/movies';

export interface DatabaseMovie {
  id: string;
  title: string;
  year: number;
  poster_url: string | null;
  trailer_url: string;
  category: string;
  is_featured: boolean | null;
  is_trending: boolean | null;
  is_latest: boolean | null;
  genres: string[];
}

// Convert database movie to frontend Movie format
export const toFrontendMovie = (dbMovie: DatabaseMovie): Movie => {
  // Find if we have a static fallback for this DB movie (to get better poster/trailer)
  const staticFallback = findStaticMovie(dbMovie.id, dbMovie.title);

  // Use static movie's ID if we found a match (to ensure consistency with static data)
  // Otherwise use database ID
  const id = staticFallback?.id || dbMovie.id;

  // Prioritize the poster:
  // 1. If dbMovie has a valid URL (not just a placeholder or empty), use it
  // 2. Otherwise use static fallback if available
  // 3. Last resort: placeholder
  const dbPoster = dbMovie.poster_url && dbMovie.poster_url.trim() !== '' ? dbMovie.poster_url : null;

  return {
    id,
    title: dbMovie.title,
    year: dbMovie.year,
    poster: dbPoster || staticFallback?.poster || `https://placehold.co/300x450/1a1a2e/10b981?text=${encodeURIComponent(dbMovie.title)}`,
    trailerUrl: staticFallback?.trailerUrl || dbMovie.trailer_url,
    genres: staticFallback?.genres || dbMovie.genres || [],
  };
};

export const useMovies = () => {
  const [dbMovies, setDbMovies] = useState<DatabaseMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const result = await api.getMovies({ limit: 1000 });
        if (result.error) {
          console.error('Error fetching movies:', result.error);
          setDbMovies([]);
        } else {
          setDbMovies(result.data?.movies || []);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        setDbMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Get latest movies from database (only 2024 and above)
  const currentYear = new Date().getFullYear();
  const latestDbMovies: Movie[] = dbMovies
    .filter(m => m.is_latest && m.year >= currentYear - 1)
    .map(toFrontendMovie);

  // Get trending movies from database
  const trendingDbMovies: Movie[] = dbMovies
    .filter(m => m.is_trending)
    .map(toFrontendMovie);

  // Get movies by category from database
  const getDbMoviesByCategory = (categoryId: string): Movie[] => {
    return dbMovies
      .filter(m => m.category.toLowerCase() === categoryId.toLowerCase())
      .map(toFrontendMovie);
  };

  return {
    dbMovies,
    latestDbMovies,
    trendingDbMovies,
    getDbMoviesByCategory,
    loading,
  };
};
