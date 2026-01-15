import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Loader2, 
  Film, 
  Plus, 
  Check,
  Star,
  ExternalLink,
  ImageOff
} from 'lucide-react';

interface TMDBMovie {
  id: number;
  title: string;
  year: number | null;
  poster_url: string | null;
  overview: string;
  rating: number;
  media_type?: string; // 'movie' or 'tv'
}

interface TMDBMovieDetails extends TMDBMovie {
  trailer_url: string | null;
  category: string;
  genres: string[];
  media_type?: string;
}

const categories = [
  'hollywood', 'nollywood', 'bollywood', 'korean', 
  'animation', 'chinese', 'european', 'thrillers', 'tv-series'
];

const AdminTMDBImport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<Set<number>>(new Set());
  const [movieDetails, setMovieDetails] = useState<Map<number, TMDBMovieDetails>>(new Map());
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    setSelectedMovies(new Set());
    setMovieDetails(new Map());

    try {
      const result = await api.searchTMDB(searchQuery);

      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error('No data returned');

      setSearchResults(result.data.movies || []);
      
      if (result.data.movies?.length === 0) {
        toast({ title: 'No Results', description: 'No movies found for your search' });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({ 
        title: 'Search Failed', 
        description: error.message || 'Failed to search TMDB',
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  };

  const fetchMovieDetails = async (tmdbId: number, mediaType?: string) => {
    if (movieDetails.has(tmdbId)) return movieDetails.get(tmdbId);

    try {
      const result = await api.getTMDBDetails(tmdbId, mediaType);

      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error('No data returned');

      const details = result.data.movie as TMDBMovieDetails;
      setMovieDetails(prev => new Map(prev).set(tmdbId, details));
      return details;
    } catch (error: any) {
      console.error('Details error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to fetch movie details',
        variant: 'destructive'
      });
      return null;
    }
  };

  const handleToggleSelect = async (movie: TMDBMovie) => {
    const newSelected = new Set(selectedMovies);
    
    if (newSelected.has(movie.id)) {
      newSelected.delete(movie.id);
    } else {
      newSelected.add(movie.id);
      // Fetch details when selected (pass media_type if available)
      await fetchMovieDetails(movie.id, movie.media_type);
    }
    
    setSelectedMovies(newSelected);
  };

  const handleImportSingle = async (tmdbId: number, mediaType?: string) => {
    setImporting(tmdbId);
    
    try {
      const details = await fetchMovieDetails(tmdbId, mediaType);
      if (!details) throw new Error('Could not get movie details');

      if (!details.trailer_url) {
        toast({ 
          title: 'No Trailer', 
          description: `${details.title} doesn't have a trailer available. Adding placeholder.`,
        });
      }

      const currentYear = new Date().getFullYear();
      const movieYear = details.year || currentYear;
      const isRecent = movieYear >= currentYear; // Only movies from the current year

      const result = await api.createMovie({
        title: details.title,
        year: movieYear,
        poster_url: details.poster_url,
        trailer_url: details.trailer_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: details.category,
        is_featured: false,
        is_trending: false,
        is_latest: isRecent,
      });

      if (result.error) throw new Error(result.error);

      setImportedIds(prev => new Set(prev).add(tmdbId));
      toast({ title: 'Success', description: `${details.title} imported successfully` });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ 
        title: 'Import Failed', 
        description: error.message || 'Failed to import movie',
        variant: 'destructive'
      });
    } finally {
      setImporting(null);
    }
  };

  const handleBulkImport = async () => {
    if (selectedMovies.size === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const tmdbId of selectedMovies) {
      if (importedIds.has(tmdbId)) continue;
      
      setImporting(tmdbId);
      try {
        // Find the movie from search results to get media_type
        const movie = searchResults.find(m => m.id === tmdbId);
        const details = await fetchMovieDetails(tmdbId, movie?.media_type);
        if (!details) {
          failCount++;
          continue;
        }

        const currentYear = new Date().getFullYear();
        const movieYear = details.year || currentYear;
        const isRecent = movieYear >= currentYear;

        const result = await api.createMovie({
          title: details.title,
          year: movieYear,
          poster_url: details.poster_url,
          trailer_url: details.trailer_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          category: details.category,
          is_featured: false,
          is_trending: false,
          is_latest: isRecent,
        });

        if (result.error) {
          failCount++;
        } else {
          successCount++;
          setImportedIds(prev => new Set(prev).add(tmdbId));
        }
      } catch {
        failCount++;
      }
    }

    setImporting(null);
    toast({ 
      title: 'Bulk Import Complete', 
      description: `${successCount} imported, ${failCount} failed` 
    });
  };

  const updateMovieCategory = (tmdbId: number, category: string) => {
    const current = movieDetails.get(tmdbId);
    if (current) {
      setMovieDetails(prev => new Map(prev).set(tmdbId, { ...current, category }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">TMDB Import</h1>
          <p className="text-muted-foreground">Search and import movies from The Movie Database</p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Search Movies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search for a movie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </div>

            {selectedMovies.size > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>{selectedMovies.size} movie(s) selected</span>
                <Button onClick={handleBulkImport} disabled={importing !== null}>
                  {importing !== null && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Import Selected
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((movie) => {
              const details = movieDetails.get(movie.id);
              const isSelected = selectedMovies.has(movie.id);
              const isImported = importedIds.has(movie.id);
              const isImporting = importing === movie.id;

              return (
                <Card 
                  key={movie.id} 
                  className={`overflow-hidden transition-colors ${isSelected ? 'ring-2 ring-primary' : ''} ${isImported ? 'opacity-60' : ''}`}
                >
                  <div className="flex">
                    {/* Poster */}
                    <div className="w-24 h-36 flex-shrink-0 bg-muted">
                      {movie.poster_url ? (
                        <img 
                          src={movie.poster_url} 
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-3 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium line-clamp-2">{movie.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {movie.media_type === 'tv' && (
                              <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                                TV
                              </Badge>
                            )}
                            {movie.year && (
                              <Badge variant="outline" className="text-xs">
                                {movie.year}
                              </Badge>
                            )}
                            {movie.rating > 0 && (
                              <span className="flex items-center text-xs text-muted-foreground">
                                <Star className="h-3 w-3 mr-0.5 fill-yellow-500 text-yellow-500" />
                                {movie.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {!isImported && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(movie)}
                          />
                        )}
                      </div>

                      {/* Category selector when selected */}
                      {isSelected && details && (
                        <div className="mt-2">
                          <Select
                            value={details.category}
                            onValueChange={(val) => updateMovieCategory(movie.id, val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!details.trailer_url && (
                            <p className="text-xs text-yellow-500 mt-1">⚠️ No trailer available</p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-auto pt-2 flex gap-2">
                        {isImported ? (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Imported
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleImportSingle(movie.id, movie.media_type)}
                            disabled={isImporting}
                            className="flex-1"
                          >
                            {isImporting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Import
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a 
                            href={`https://www.themoviedb.org/movie/${movie.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!searching && searchResults.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search for movies to import from TMDB</p>
            <p className="text-sm mt-1">Results will show poster, year, and rating</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTMDBImport;
