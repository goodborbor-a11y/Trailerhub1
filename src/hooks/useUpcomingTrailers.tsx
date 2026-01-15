import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Movie } from '@/data/movies';

export interface UpcomingTrailer {
    id: string;
    title: string;
    category: string;
    description: string | null;
    poster_url: string | null;
    release_date: string;
    trailer_url: string | null;
    is_released: boolean;
}

// Convert upcoming trailer to frontend Movie format for search results
export const upcomingToMovie = (trailer: UpcomingTrailer): Movie => {
    return {
        id: `upcoming-${trailer.id}`,
        title: trailer.title,
        year: new Date(trailer.release_date).getFullYear(),
        poster: trailer.poster_url || `https://placehold.co/300x450/1a1a2e/06b6d4?text=${encodeURIComponent(trailer.title)}`,
        trailerUrl: trailer.trailer_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };
};

export const useUpcomingTrailers = () => {
    const [upcomingTrailers, setUpcomingTrailers] = useState<UpcomingTrailer[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUpcoming = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.getUpcomingTrailers();
            if (result.data) {
                setUpcomingTrailers(result.data.trailers || []);
            } else {
                setUpcomingTrailers([]);
            }
        } catch (error) {
            console.error('Error fetching upcoming trailers:', error);
            setUpcomingTrailers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUpcoming();
    }, [fetchUpcoming]);

    return {
        upcomingTrailers,
        loading,
        refresh: fetchUpcoming,
    };
};
