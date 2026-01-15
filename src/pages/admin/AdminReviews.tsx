import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  movie_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = async () => {
    try {
      const result = await api.getAllRatings();
      if (!result.data) {
        throw new Error(result.error || 'Failed to fetch ratings');
      }

      // Map to Review format (backend returns display_name directly)
      const reviewsWithProfiles = result.data.ratings.map(rating => ({
        ...rating,
        profiles: rating.display_name ? { display_name: rating.display_name } : null,
      })) as Review[];

      setReviews(reviewsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load reviews', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const result = await api.deleteRating(id);
      if (result.error) throw new Error(result.error);
      toast({ title: 'Success', description: 'Review deleted successfully' });
      fetchReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete review', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">Moderate user reviews</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reviews yet.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Movie ID</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.profiles?.display_name || 'Anonymous'}
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate">{review.movie_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        {review.rating}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate">{review.review || '-'}</p>
                    </TableCell>
                    <TableCell>{format(new Date(review.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(review.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
