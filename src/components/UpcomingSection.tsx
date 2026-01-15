import { useState, useEffect, useCallback } from "react";
import api, { getImageUrl } from "@/lib/api";
import { Calendar, Bell, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UpcomingTrailer {
  id: string;
  title: string;
  category: string;
  description: string | null;
  poster_url: string | null;
  release_date: string;
  trailer_url: string | null;
  is_released: boolean;
}

export const UpcomingSection = () => {
  const [upcomingTrailers, setUpcomingTrailers] = useState<UpcomingTrailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch upcoming trailers function (used by refresh button)
  // Fetch upcoming trailers function (used by refresh button)
  const fetchUpcoming = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getUpcomingTrailers();
      if (result.data) {
        setUpcomingTrailers(result.data.trailers || []);
      } else {
        setUpcomingTrailers([]);
      }
    } catch (error: any) {
      console.error('[UpcomingSection] Error:', error);
      setUpcomingTrailers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch upcoming trailers automatically on component mount - RUN IMMEDIATELY
  // Fetch upcoming trailers automatically on component mount
  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);


  const fetchSubscriptions = async () => {
    if (!user) return;
    // TODO: Implement subscription API endpoint
    // For now, subscriptions are disabled until backend endpoint is created
    setSubscribedIds(new Set());
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const handleSubscribe = async (trailerId: string) => {
    if (subscribing === trailerId) return; // Prevent double-clicking

    setSubscribing(trailerId);

    // For now, connect to newsletter subscription
    // If user is logged in, use their email, otherwise prompt for email
    if (user?.email) {
      // User is logged in - subscribe their email to newsletter
      try {
        const result = await api.subscribeNewsletter(user.email);
        if (result.error) {
          if (result.error.includes('already') || result.error.includes('unique')) {
            // Mark as subscribed even if already subscribed
            setSubscribedIds(prev => new Set(prev).add(trailerId));
            toast({
              title: 'Already subscribed',
              description: "You're already subscribed to our newsletter!",
            });
          } else {
            throw new Error(result.error);
          }
        } else {
          // Mark as subscribed
          setSubscribedIds(prev => new Set(prev).add(trailerId));
          toast({
            title: 'Subscribed!',
            description: 'You will be notified about upcoming trailers via email.',
          });
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to subscribe. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setSubscribing(null);
      }
    } else {
      // User is not logged in - prompt them to enter email
      const email = prompt('Enter your email to get notified about upcoming trailers:');
      if (email && email.includes('@')) {
        try {
          const result = await api.subscribeNewsletter(email);
          if (result.error) {
            if (result.error.includes('already') || result.error.includes('unique')) {
              // Mark as subscribed even if already subscribed
              setSubscribedIds(prev => new Set(prev).add(trailerId));
              toast({
                title: 'Already subscribed',
                description: "You're already subscribed to our newsletter!",
              });
            } else {
              throw new Error(result.error);
            }
          } else {
            // Mark as subscribed
            setSubscribedIds(prev => new Set(prev).add(trailerId));
            toast({
              title: 'Subscribed!',
              description: 'You will be notified about upcoming trailers via email.',
            });
          }
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'Failed to subscribe. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setSubscribing(null);
        }
      } else if (email) {
        toast({
          title: 'Invalid email',
          description: 'Please enter a valid email address.',
          variant: 'destructive',
        });
        setSubscribing(null);
      } else {
        setSubscribing(null);
      }
    }
  };

  // Show section if loading or if there are trailers
  // Don't hide it completely - show empty state instead
  // if (upcomingTrailers.length === 0 && !isLoading) return null;

  return (
    <section className="relative py-10 overflow-hidden">
      {/* Cyan glowing background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-cyan-500/15 blur-[80px] animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[250px] rounded-full bg-teal-500/10 blur-[60px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container relative px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="h-10 w-10 text-cyan-400" />
            <div>
              <h2 className="font-display text-2xl md:text-3xl tracking-wider text-cyan-400 uppercase">
                Upcoming Trailers
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Coming soon - Subscribe to get notified
              </p>
            </div>
          </div>

          <button
            onClick={fetchUpcoming}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Upcoming trailers grid - YouTube rectangular style */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-video rounded-lg bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : upcomingTrailers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming trailers at the moment.</p>
            <p className="text-sm mt-2">Check back soon for new releases!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTrailers.map((trailer, index) => (
              <div
                key={trailer.id}
                className="group relative rounded-lg overflow-hidden bg-card border border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Thumbnail - YouTube rectangular aspect ratio */}
                <div className="aspect-video relative">
                  {trailer.poster_url ? (
                    <img
                      src={getImageUrl(trailer.poster_url) || ''}
                      alt={trailer.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image load error for:', trailer.poster_url, 'Resolved URL:', getImageUrl(trailer.poster_url));
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-900/50 to-teal-900/50 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-cyan-400/50" />
                    </div>
                  )}

                  {/* Release date badge */}
                  <div className="absolute top-2 right-2 bg-cyan-500/90 text-white text-xs font-medium px-2 py-1 rounded">
                    {format(new Date(trailer.release_date), 'MMM d, yyyy')}
                  </div>

                  {/* Subscribe overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant={subscribedIds.has(trailer.id) ? "secondary" : "default"}
                      onClick={() => handleSubscribe(trailer.id)}
                      disabled={subscribing === trailer.id}
                      className="gap-2"
                    >
                      <Bell className={`h-4 w-4 ${subscribedIds.has(trailer.id) ? 'fill-current' : ''}`} />
                      {subscribing === trailer.id ? 'Subscribing...' : subscribedIds.has(trailer.id) ? 'Subscribed' : 'Notify Me'}
                    </Button>
                  </div>
                </div>

                {/* Title, category, and short story */}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-foreground truncate">{trailer.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize mb-2">{trailer.category}</p>
                  {trailer.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-3 leading-relaxed">
                      {trailer.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
