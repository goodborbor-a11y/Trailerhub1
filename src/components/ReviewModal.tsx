import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from './RatingStars';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { getOrCreateGuestIdentifier } from '@/lib/guestIdentifier';
import { Movie } from '@/data/movies';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie | null;
}

const MAX_REVIEW_LENGTH = 5000;

export const ReviewModal = ({ isOpen, onClose, movie }: ReviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  useEffect(() => {
    if (isOpen && movie) {
      fetchExistingReview();
    }
  }, [isOpen, movie, user]);

  const fetchExistingReview = async () => {
    if (!movie) return;

    setIsLoading(true);
    try {
      // Fetch all ratings for this movie
      const result = await api.getMovieRatings(movie.id);
      
      if (result.error) {
        console.error('Error fetching reviews:', result.error);
        setRating(0);
        setReview('');
        setExistingReviewId(null);
        setHasExistingReview(false);
        setIsLoading(false);
        return;
      }

      const ratings = result.data?.ratings || [];
      
      if (user) {
        // Find review by this user
        const userReview = ratings.find((r: any) => r.user_id === user.id);
        if (userReview) {
          setRating(userReview.rating);
          setReview(userReview.review || '');
          setExistingReviewId(userReview.id);
          setHasExistingReview(true);
        } else {
          setRating(0);
          setReview('');
          setExistingReviewId(null);
          setHasExistingReview(false);
        }
      } else {
        // For guests, check if there's a review with guest identifier
        // Since we can't easily query by guest_id, we'll check if a review exists
        // and allow updating it (the backend will handle guest identifier matching)
        const guestId = getOrCreateGuestIdentifier();
        // For now, we'll just allow creating/updating - the backend handles guest matching
        setRating(0);
        setReview('');
        setExistingReviewId(null);
        setHasExistingReview(false);
      }
    } catch (error) {
      console.error('Error fetching review:', error);
      setRating(0);
      setReview('');
      setExistingReviewId(null);
      setHasExistingReview(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!movie || rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const guestIdentifier = !user ? getOrCreateGuestIdentifier() : undefined;
      console.log('Submitting review:', { movieId: movie.id, rating, review, guestIdentifier, hasUser: !!user });
      
      const result = await api.submitRating(movie.id, rating, review || undefined, guestIdentifier);
      
      console.log('Review submission result:', result);
      
      if (result.error) {
        console.error('Review submission error:', result.error);
        throw new Error(result.error);
      }

      if (!result.data) {
        console.error('Review submission: No data returned');
        throw new Error('No data returned from server');
      }

      toast({ 
        title: hasExistingReview ? 'Review updated!' : 'Review submitted!',
        description: !user ? 'Your review has been saved. Sign in to sync across devices.' : undefined
      });
      
      // Reset form state
      setRating(0);
      setReview('');
      setExistingReviewId(null);
      setHasExistingReview(false);
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
        // Refresh the review list
        fetchExistingReview();
      }, 500);
    } catch (error: any) {
      console.error('Review submission failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save review. Please try again.',
        variant: 'destructive',
      });
      // Don't close modal on error - let user retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!movie || !existingReviewId) return;

    setIsSubmitting(true);

    try {
      const result = await api.deleteRating(existingReviewId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({ title: 'Review deleted' });
      onClose();
      // Reset form
      setRating(0);
      setReview('');
      setExistingReviewId(null);
      setHasExistingReview(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete review.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!movie) return null;

  const isEditing = hasExistingReview;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">
            {isEditing ? 'EDIT REVIEW' : 'WRITE A REVIEW'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-16 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold">{movie.title}</h3>
                  <p className="text-sm text-muted-foreground">{movie.year}</p>
                </div>
              </div>

              {!user && (
                <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                  Your review will be saved. Sign in to sync across devices and manage your reviews.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Rating *</label>
                <RatingStars rating={rating} onRate={setRating} size="lg" interactive />
                {rating === 0 && (
                  <p className="text-xs text-muted-foreground">Tap a star to rate</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Review (optional)</label>
                <Textarea
                  placeholder="What did you think of this movie?"
                  value={review}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_REVIEW_LENGTH) {
                      setReview(e.target.value);
                    }
                  }}
                  rows={4}
                  maxLength={MAX_REVIEW_LENGTH}
                />
                <p className="text-sm text-muted-foreground text-right">
                  {review.length.toLocaleString()}/{MAX_REVIEW_LENGTH.toLocaleString()} characters
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                {isEditing && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    Delete
                  </Button>
                )}
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating === 0 || isLoading}
                  className="bg-gradient-button"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Submit'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
