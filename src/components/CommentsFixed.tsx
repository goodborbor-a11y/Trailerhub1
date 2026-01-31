import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Reply, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { getOrCreateGuestIdentifier } from '@/lib/guestIdentifier';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
    id: string;
    user_id: string | null;
    movie_id: string;
    parent_comment_id: string | null;
    author_name: string;
    content: string;
    display_name?: string;
    avatar_url?: string | null;
    like_count: number;
    created_at: string;
    replies?: Comment[];
    is_liked?: boolean;
}

interface CommentsProps {
    movieId: string;
    movieTitle?: string;
}

export const CommentsFixed = ({ movieId, movieTitle }: CommentsProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const retryCountRef = useRef(0);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [newCommentContent, setNewCommentContent] = useState('');
    const replyInputRef = useRef<HTMLTextAreaElement>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fetchAttemptRef = useRef(0);

    const isFetchingRef = useRef(false);
    const fetchCommentsRef = useRef<() => Promise<void>>(() => Promise.resolve());

    // Main fetch function
    const fetchComments = useCallback(async () => {
        // Prevent multiple simultaneous fetches
        if (isFetchingRef.current) {
            console.log('[Comments] Fetch already in progress, skipping', { movieId });
            return;
        }

        isFetchingRef.current = true;
        fetchAttemptRef.current += 1;
        const attempt = fetchAttemptRef.current;

        console.log('[Comments] Fetch start', { movieId, attempt });
        setLoading(true);
        // Don't clear error immediately - only clear on success
        // This prevents blinking error messages

        try {
            // Wrap API call in Promise.resolve to catch any synchronous errors
            // and ensure we never throw unhandled errors
            let result;
            try {
                // Use Promise.resolve to ensure we catch any errors, even if api.getComments throws synchronously
                result = await Promise.resolve(api.getComments(movieId)).catch((apiError: any) => {
                    // If the promise rejects, convert it to an error result
                    console.warn('[Comments] API promise rejection (will retry):', { movieId, attempt, error: apiError?.message || 'Unknown error' });
                    return { error: apiError?.message || 'Network error', data: null };
                });
            } catch (apiError: any) {
                // Catch any synchronous errors from the API client
                console.warn('[Comments] API call error (will retry):', { movieId, attempt, error: apiError?.message || 'Unknown error' });
                // Treat as transient error - don't show toast, just retry
                if (attempt >= 3) {
                    setError('Comments failed to load. Please refresh the page.');
                    setComments([]); // Set empty array on persistent failure
                } else {
                    retryCountRef.current += 1;
                    // Schedule retry with exponential backoff
                    if (retryTimeoutRef.current) {
                        clearTimeout(retryTimeoutRef.current);
                    }
                    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
                    retryTimeoutRef.current = setTimeout(() => {
                        fetchCommentsRef.current();
                    }, delay);
                }
                setLoading(false);
                isFetchingRef.current = false;
                return;
            }

            // Safely access comments - ensure result and data exist
            const commentsData = result?.data?.comments;
            const commentCount = Array.isArray(commentsData) ? commentsData.length : 0;

            console.log('[Comments] Fetch end', { movieId, attempt, hasError: !!result?.error, commentCount });

            // Check if result has error
            if (result?.error) {
                // Only show persistent error after multiple retries
                if (attempt >= 3) {
                    console.error('[Comments] Persistent error after retries:', result.error);
                    setError('Comments failed to load. Please refresh the page.');
                    setComments([]); // Set empty array on persistent failure
                    // Don't show toast - just set error state
                } else {
                    // Transient error - retry silently without showing error state
                    console.warn('[Comments] Transient error, will retry:', result.error);
                    retryCountRef.current += 1;
                    // Schedule retry with exponential backoff
                    if (retryTimeoutRef.current) {
                        clearTimeout(retryTimeoutRef.current);
                    }
                    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
                    retryTimeoutRef.current = setTimeout(() => {
                        fetchCommentsRef.current();
                    }, delay);
                }
            } else {
                // Success - clear error and reset
                // Ensure comments is always an array
                const comments = Array.isArray(commentsData) ? commentsData : [];
                setComments(comments);
                setError(null);
                retryCountRef.current = 0;
                fetchAttemptRef.current = 0; // Reset on success
                setLoading(false);
                console.log('[Comments] Successfully loaded comments', { movieId, count: comments.length });
            }
        } catch (error: any) {
            // Catch any unexpected errors (shouldn't happen, but be defensive)
            console.error('[Comments] Unexpected fetch exception:', { movieId, attempt, error: error?.message || 'Unknown error' });

            // Only show persistent error after multiple retries
            if (attempt >= 3) {
                setError('Comments failed to load. Please refresh the page.');
                setComments([]); // Set empty array on persistent failure
            } else {
                // Transient error - retry silently without showing error state
                retryCountRef.current += 1;
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
                retryTimeoutRef.current = setTimeout(() => {
                    fetchCommentsRef.current();
                }, delay);
            }
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [movieId]);

    // Update ref whenever fetchComments changes
    useEffect(() => {
        fetchCommentsRef.current = fetchComments;
    }, [fetchComments]);

    useEffect(() => {
        // Reset state when movieId changes
        fetchAttemptRef.current = 0;
        setError(null);
        retryCountRef.current = 0;
        setComments([]);
        setLoading(true);

        // Small delay to prevent rapid re-fetches
        const timeoutId = setTimeout(() => {
            fetchComments();
        }, 100);

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
            clearTimeout(timeoutId);
        };
    }, [movieId, fetchComments]);

    const handleSubmitComment = async () => {
        if (!newCommentContent.trim()) {
            toast({
                title: 'Comment required',
                description: 'Please enter a comment',
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        try {
            const guestIdentifier = !user ? getOrCreateGuestIdentifier() : undefined;
            const authorName = user ? undefined : 'Guest';

            const result = await api.createComment(
                movieId,
                newCommentContent.trim(),
                undefined,
                authorName,
                guestIdentifier
            );

            if (result.error) {
                throw new Error(result.error);
            }

            toast({
                title: 'Comment posted!',
                description: 'Your comment has been added',
            });

            setNewCommentContent('');

            // Optimistically add the new comment to the list if returned by API
            if (result.data?.comment) {
                setComments(prev => [result.data.comment, ...prev]);
            } else {
                fetchComments(); // Refresh comments as fallback
            }
        } catch (error: any) {
            console.error('Error posting comment:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to post comment',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (parentId: string) => {
        if (!replyContent.trim()) {
            toast({
                title: 'Reply required',
                description: 'Please enter a reply',
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        try {
            const guestIdentifier = !user ? getOrCreateGuestIdentifier() : undefined;
            const authorName = user ? undefined : 'Guest';

            const result = await api.createComment(
                movieId,
                replyContent.trim(),
                parentId,
                authorName,
                guestIdentifier
            );

            if (result.error) {
                throw new Error(result.error);
            }

            toast({
                title: 'Reply posted!',
                description: 'Your reply has been added',
            });

            setReplyContent('');
            setReplyingTo(null);
            fetchComments(); // Refresh comments
        } catch (error: any) {
            console.error('Error posting reply:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to post reply',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId: string) => {
        try {
            const guestIdentifier = !user ? getOrCreateGuestIdentifier() : undefined;
            const result = await api.likeComment(commentId, guestIdentifier);

            if (result.error) {
                throw new Error(result.error);
            }

            // Update local state
            setComments(prevComments => {
                const updateComment = (comment: Comment): Comment => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            like_count: result.data?.like_count || comment.like_count,
                            is_liked: result.data?.liked || false,
                        };
                    }
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: comment.replies.map(updateComment),
                        };
                    }
                    return comment;
                };
                return prevComments.map(updateComment);
            });
        } catch (error: any) {
            console.error('Error liking comment:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to like comment',
                variant: 'destructive',
            });
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'recently';
        }
    };

    if (loading && comments.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-display text-foreground mb-4">
                    Comments ({comments.length})
                </h3>

                {/* Persistent error message (non-blinking) - only show if not loading and error exists */}
                {error && !loading && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Loading indicator (only if we have existing comments) */}
                {loading && comments.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading comments...</span>
                    </div>
                )}

                {/* New Comment Input */}
                <div className="space-y-2 mb-6">
                    <Textarea
                        value={newCommentContent}
                        onChange={(e) => setNewCommentContent(e.target.value)}
                        placeholder={`Add a comment${movieTitle ? ` about ${movieTitle}` : ''}...`}
                        className="min-h-[100px] resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleSubmitComment();
                            }
                        }}
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSubmitComment}
                            disabled={submitting || !newCommentContent.trim()}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Post Comment
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Comments List */}
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                replyContent={replyContent}
                                setReplyContent={setReplyContent}
                                submitting={submitting}
                                handleReply={handleReply}
                                handleLike={handleLike}
                                formatDate={formatDate}
                                replyInputRef={replyInputRef}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface CommentItemProps {
    comment: Comment;
    isReply?: boolean;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    submitting: boolean;
    handleReply: (parentId: string) => Promise<void>;
    handleLike: (commentId: string) => Promise<void>;
    formatDate: (date: string) => string;
    replyInputRef: React.RefObject<HTMLTextAreaElement>;
}

const CommentItem = ({
    comment,
    isReply = false,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    submitting,
    handleReply,
    handleLike,
    formatDate,
    replyInputRef
}: CommentItemProps) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const isLiked = comment.is_liked || false;

    return (
        <div className={`${isReply ? 'ml-8 mt-3' : 'mb-4'}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {comment.avatar_url ? (
                        <img
                            src={comment.avatar_url}
                            alt={comment.display_name || comment.author_name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                            {(comment.display_name || comment.author_name || 'A').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-foreground">
                                {comment.display_name || comment.author_name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                            </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {comment.content}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${isLiked
                                ? 'text-primary hover:text-primary/80'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.like_count || 0}</span>
                        </button>

                        {!isReply && (
                            <button
                                onClick={() => {
                                    setShowReplyInput(!showReplyInput);
                                    setReplyingTo(comment.id);
                                    setTimeout(() => replyInputRef.current?.focus(), 100);
                                }}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Reply className="h-4 w-4" />
                                <span>Reply</span>
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {showReplyInput && replyingTo === comment.id && (
                        <div className="mt-3 space-y-2">
                            <Textarea
                                ref={replyInputRef}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[80px] resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        handleReply(comment.id);
                                    }
                                }}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleReply(comment.id)}
                                    disabled={submitting || !replyContent.trim()}
                                >
                                    <Send className="h-3 w-3 mr-1" />
                                    Post Reply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setShowReplyInput(false);
                                        setReplyingTo(null);
                                        setReplyContent('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {comment.replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    isReply={true}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    submitting={submitting}
                                    handleReply={handleReply}
                                    handleLike={handleLike}
                                    formatDate={formatDate}
                                    replyInputRef={replyInputRef}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
