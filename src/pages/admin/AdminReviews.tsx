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
import { Trash2, Loader2, MessageSquare, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface Comment {
  id: string;
  movie_id: string;
  user_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  like_count: number;
  reply_count: number;
  parent_comment_id: string | null;
}

const AdminReviews = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchComments = async () => {
    try {
      const result = await api.getAdminComments();
      if (!result.data) {
        throw new Error(result.error || 'Failed to fetch comments');
      }

      setComments(result.data.comments);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load comments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const result = await api.deleteAdminComment(id);
      if (result.error) throw new Error(result.error);
      toast({ title: 'Success', description: 'Comment deleted successfully' });
      fetchComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete comment', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users Comments</h1>
          <p className="text-muted-foreground">Moderate user comments on movies</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Movie ID</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell className="font-medium">
                      {comment.author_name}
                    </TableCell>
                    <TableCell>
                      {comment.parent_comment_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          Reply
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Comment
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate" title={comment.content}>{comment.content}</p>
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate">{comment.movie_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {comment.like_count}
                        </span>
                        {!comment.parent_comment_id && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {comment.reply_count}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(comment.id)}>
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
