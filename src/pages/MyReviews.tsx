import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { RatingStars } from '@/components/RatingStars';
import { SEOHead, SEO_CONFIG } from '@/components/SEOHead';
import { categories, latestTrailers, trendingTrailers, tvSeriesCategory, Movie } from '@/data/movies';

interface ReviewWithMovie {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  movie: Movie | null;
}

const MyReviews = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const getAllMovies = (): Movie[] => {
    const allMovies: Movie[] = [
      ...latestTrailers.movies,
      ...trendingTrailers.movies,
      ...tvSeriesCategory.movies,
    ];
    categories.forEach(cat => allMovies.push(...cat.movies));
    return allMovies;
  };

  const fetchReviews = async () => {
    if (!user) return;
    
    try {
      const result = await api.getUserRatings();
      
      if (result.error) {
        console.error('Error fetching reviews:', result.error);
        setReviews([]);
        setLoading(false);
        return;
      }

      const ratingsData = result.data?.ratings || [];
      const allMovies = getAllMovies();
      const reviewsWithMovies = ratingsData.map((review: any) => ({
        ...review,
        movie: allMovies.find(m => m.id === review.movie_id) || null,
      }));
      setReviews(reviewsWithMovies);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const result = await api.deleteRating(reviewId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setReviews(reviews.filter(r => r.id !== reviewId));
      toast({ title: 'Review deleted' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete review.',
        variant: 'destructive',
      });
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
        title={SEO_CONFIG.reviews.title}
        description={SEO_CONFIG.reviews.description}
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
          <Star className="h-8 w-8 text-primary fill-primary" />
          <h1 className="font-display text-4xl tracking-wide">MY REVIEWS</h1>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No reviews yet</h2>
            <p className="text-muted-foreground mb-4">
              Rate and review movies to see them here!
            </p>
            <Button onClick={() => navigate('/')} className="bg-gradient-button">
              Browse Movies
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div
                key={review.id}
                className="bg-card/50 border border-border rounded-xl p-4 flex gap-4"
              >
                {review.movie && (
                  <img
                    src={review.movie.poster}
                    alt={review.movie.title}
                    className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {review.movie?.title || 'Unknown Movie'}
                      </h3>
                      <RatingStars rating={review.rating} size="sm" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(review.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {review.review && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {review.review}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviews;
