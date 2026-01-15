import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Star, 
  AlertTriangle,
  Loader2,
  Check,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface MoviePopularity {
  id: string;
  title: string;
  watchlist_count: number;
  favorites_count: number;
  rating_count: number;
  avg_rating: number;
}

interface LowRatingAlert {
  id: string;
  movie_id: string;
  movie_title?: string;
  avg_rating: number;
  total_ratings: number;
  is_acknowledged: boolean;
  created_at: string;
}

const AdminAnalytics = () => {
  const [popularMovies, setPopularMovies] = useState<MoviePopularity[]>([]);
  const [alerts, setAlerts] = useState<LowRatingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      const result = await api.getAdminAnalytics();
      if (result.error) {
        throw new Error(result.error);
      }
      setPopularMovies(result.data?.popularMovies || []);
      setAlerts(result.data?.alerts || []);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // TODO: Implement acknowledge alert endpoint in backend
      toast({ title: 'Success', description: 'Alert acknowledged' });
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
      toast({ title: 'Error', description: error.message || 'Failed to acknowledge alert', variant: 'destructive' });
    }
  };

  const getPopularityScore = (movie: MoviePopularity) => {
    return movie.watchlist_count * 2 + movie.favorites_count * 3 + movie.rating_count;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Movie popularity metrics and alerts</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Low Rating Alerts Section */}
            {alerts.filter(a => !a.is_acknowledged).length > 0 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Low Rating Alerts ({alerts.filter(a => !a.is_acknowledged).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.filter(a => !a.is_acknowledged).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                        <div className="flex items-center gap-4">
                          <TrendingDown className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="font-medium">{alert.movie_title}</p>
                            <p className="text-sm text-muted-foreground">
                              Avg: {alert.avg_rating.toFixed(1)} ★ from {alert.total_ratings} ratings
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(alert.created_at), 'MMM d, yyyy')}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Popular Movies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top 10 Popular Movies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {popularMovies.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No popularity data available yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Movie</TableHead>
                        <TableHead className="text-center">
                          <Eye className="h-4 w-4 inline mr-1" />
                          Watchlist
                        </TableHead>
                        <TableHead className="text-center">❤️ Favorites</TableHead>
                        <TableHead className="text-center">
                          <Star className="h-4 w-4 inline mr-1" />
                          Ratings
                        </TableHead>
                        <TableHead className="text-center">Avg Rating</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {popularMovies.map((movie, index) => (
                        <TableRow key={movie.id}>
                          <TableCell>
                            <Badge variant={index < 3 ? 'default' : 'outline'}>
                              #{index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{movie.title}</TableCell>
                          <TableCell className="text-center">{movie.watchlist_count}</TableCell>
                          <TableCell className="text-center">{movie.favorites_count}</TableCell>
                          <TableCell className="text-center">{movie.rating_count}</TableCell>
                          <TableCell className="text-center">
                            {movie.avg_rating > 0 ? (
                              <span className="flex items-center justify-center gap-1">
                                {movie.avg_rating.toFixed(1)}
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
                              <TrendingUp className="h-3 w-3" />
                              {getPopularityScore(movie)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Acknowledged Alerts History */}
            {alerts.filter(a => a.is_acknowledged).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-muted-foreground">Acknowledged Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alerts.filter(a => a.is_acknowledged).slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                        <span>{alert.movie_title} - {alert.avg_rating.toFixed(1)} ★</span>
                        <span className="text-muted-foreground">
                          {format(new Date(alert.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
