import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Film, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  year: number;
  poster_url: string | null;
  trailer_url: string;
  category: string;
  is_featured: boolean;
  is_trending: boolean;
  is_latest: boolean;
  created_at: string;
}

const defaultCategories = [
  'hollywood',
  'nollywood',
  'bollywood',
  'korean',
  'animation',
  'chinese',
  'european',
  'thrillers',
  'tv-series',
];

const AdminMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear(),
    poster_url: '',
    trailer_url: '',
    category: 'hollywood',
    is_featured: false,
    is_trending: false,
    is_latest: false,
  });

  const fetchMovies = async () => {
    try {
      const result = await api.getMovies({ limit: 1000 });
      if (result.error) {
        console.error('Movies API error:', result.error);
        toast({ title: 'Error', description: result.error || 'Failed to load movies', variant: 'destructive' });
        setMovies([]);
      } else if (result.data) {
        setMovies(result.data.movies || []);
      } else {
        setMovies([]);
      }
    } catch (error: any) {
      console.error('Error fetching movies:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load movies', variant: 'destructive' });
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Filter movies based on search query
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    const query = searchQuery.toLowerCase();
    return movies.filter(movie => 
      movie.title.toLowerCase().includes(query) ||
      movie.category.toLowerCase().includes(query) ||
      movie.year.toString().includes(query)
    );
  }, [movies, searchQuery]);

  const resetForm = () => {
    setFormData({
      title: '',
      year: new Date().getFullYear(),
      poster_url: '',
      trailer_url: '',
      category: 'hollywood',
      is_featured: false,
      is_trending: false,
      is_latest: false,
    });
    setEditingMovie(null);
  };

  const openEditDialog = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      year: movie.year,
      poster_url: movie.poster_url || '',
      trailer_url: movie.trailer_url,
      category: movie.category,
      is_featured: movie.is_featured,
      is_trending: movie.is_trending,
      is_latest: movie.is_latest,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingMovie) {
        const result = await api.updateMovie(editingMovie.id, {
          title: formData.title,
          year: formData.year,
          poster_url: formData.poster_url || null,
          trailer_url: formData.trailer_url,
          category: formData.category,
          is_featured: formData.is_featured,
          is_trending: formData.is_trending,
          is_latest: formData.is_latest,
        });

        if (result.error) throw new Error(result.error);
        toast({ title: 'Success', description: 'Movie updated successfully' });
      } else {
        const result = await api.createMovie({
          title: formData.title,
          year: formData.year,
          poster_url: formData.poster_url || null,
          trailer_url: formData.trailer_url,
          category: formData.category,
          is_featured: formData.is_featured,
          is_trending: formData.is_trending,
          is_latest: formData.is_latest,
        });

        if (result.error) throw new Error(result.error);
        toast({ title: 'Success', description: 'Movie added successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMovies();
    } catch (error: any) {
      console.error('Error saving movie:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save movie', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this movie?')) return;

    try {
      const result = await api.deleteMovie(id);
      if (result.error) throw new Error(result.error);
      toast({ title: 'Success', description: 'Movie deleted successfully' });
      fetchMovies();
    } catch (error: any) {
      console.error('Error deleting movie:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete movie', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Movies</h1>
            <p className="text-muted-foreground">Manage your movie catalog ({movies.length} total)</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Movie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMovie ? 'Edit Movie' : 'Add New Movie'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min={1900}
                    max={2100}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailer_url">Trailer URL (YouTube)</Label>
                  <Input
                    id="trailer_url"
                    type="url"
                    value={formData.trailer_url}
                    onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poster_url">Poster URL</Label>
                  <Input
                    id="poster_url"
                    type="url"
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {defaultCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <Label>Visibility</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: !!checked })}
                      />
                      <Label htmlFor="is_featured" className="font-normal">Featured</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_trending"
                        checked={formData.is_trending}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_trending: !!checked })}
                      />
                      <Label htmlFor="is_trending" className="font-normal">Trending</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_latest"
                        checked={formData.is_latest}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_latest: !!checked })}
                      />
                      <Label htmlFor="is_latest" className="font-normal">Latest</Label>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingMovie ? 'Update Movie' : 'Add Movie'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search movies by title, category, or year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No movies yet. Add your first movie to get started.</p>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No movies match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell className="font-medium">{movie.title}</TableCell>
                    <TableCell>{movie.year}</TableCell>
                    <TableCell className="capitalize">{movie.category.replace('-', ' ')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {movie.is_featured && <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded">Featured</span>}
                        {movie.is_trending && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">Trending</span>}
                        {movie.is_latest && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">Latest</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(movie)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(movie.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

export default AdminMovies;
