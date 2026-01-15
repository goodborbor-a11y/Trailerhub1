import { useEffect, useState, useMemo, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Search, Plus, Pencil, Trash2, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import api, { getImageUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UpcomingTrailer {
  id: string;
  title: string;
  description: string | null;
  category: string;
  poster_url: string | null;
  trailer_url: string | null;
  release_date: string;
  is_released: boolean;
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

const AdminUpcomingTrailers = () => {
  const [trailers, setTrailers] = useState<UpcomingTrailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrailer, setEditingTrailer] = useState<UpcomingTrailer | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'hollywood',
    poster_url: '',
    trailer_url: '',
    release_date: '',
    is_released: false,
  });

  const fetchTrailers = async () => {
    try {
      const result = await api.getAdminUpcomingTrailers();
      if (result.error) {
        throw new Error(result.error);
      }
      setTrailers(result.data?.trailers || []);
    } catch (error: any) {
      console.error('Error fetching upcoming trailers:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load upcoming trailers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrailers();
  }, []);

  const filteredTrailers = useMemo(() => {
    if (!searchQuery.trim()) return trailers;
    const query = searchQuery.toLowerCase();
    return trailers.filter(trailer =>
      trailer.title.toLowerCase().includes(query) ||
      trailer.category.toLowerCase().includes(query) ||
      (trailer.description?.toLowerCase().includes(query) ?? false)
    );
  }, [trailers, searchQuery]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'hollywood',
      poster_url: '',
      trailer_url: '',
      release_date: '',
      is_released: false,
    });
    setEditingTrailer(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `upcoming-posters/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file using API
      const uploadResult = await api.uploadFile(file);
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }
      
      const publicUrl = uploadResult.data?.url || '';
      // Convert relative URL to absolute for preview, but keep relative in formData (backend accepts it)
      const absoluteUrl = getImageUrl(publicUrl) || publicUrl;
      setFormData({ ...formData, poster_url: publicUrl });
      setPreviewUrl(absoluteUrl);
      toast({ title: 'Upload successful', description: 'Poster image uploaded' });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const clearPoster = () => {
    setFormData({ ...formData, poster_url: '' });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditDialog = (trailer: UpcomingTrailer) => {
    setEditingTrailer(trailer);
    const posterUrl = trailer.poster_url || '';
    setFormData({
      title: trailer.title,
      description: trailer.description || '',
      category: trailer.category,
      poster_url: posterUrl,
      trailer_url: trailer.trailer_url || '',
      release_date: trailer.release_date ? format(new Date(trailer.release_date), 'yyyy-MM-dd') : '',
      is_released: trailer.is_released,
    });
    // Convert relative URL to absolute for preview
    const previewUrl = getImageUrl(posterUrl);
    setPreviewUrl(previewUrl);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        poster_url: formData.poster_url.trim() || null,
        trailer_url: formData.trailer_url.trim() || null,
        release_date: formData.release_date,
        is_released: formData.is_released,
      };

      if (editingTrailer) {
        const result = await api.updateUpcomingTrailer(editingTrailer.id, payload);
        if (result.error) {
          throw new Error(result.error);
        }
        toast({ title: 'Success', description: 'Upcoming trailer updated successfully' });
      } else {
        const result = await api.createUpcomingTrailer(payload);
        if (result.error) {
          throw new Error(result.error);
        }
        toast({ title: 'Success', description: 'Upcoming trailer added successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTrailers();
    } catch (error: any) {
      console.error('Error saving upcoming trailer:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save upcoming trailer', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this upcoming trailer?')) return;

    try {
      const result = await api.deleteUpcomingTrailer(id);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({ title: 'Success', description: 'Upcoming trailer deleted successfully' });
      fetchTrailers();
    } catch (error: any) {
      console.error('Error deleting upcoming trailer:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete upcoming trailer', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Upcoming Trailers</h1>
            <p className="text-muted-foreground">Manage upcoming movie trailers ({trailers.length} total)</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Upcoming
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTrailer ? 'Edit Upcoming Trailer' : 'Add Upcoming Trailer'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Short Story / Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Write an interesting short story or teaser about this upcoming movie..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{formData.description.length}/500 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="release_date">Release Date</Label>
                  <Input
                    id="release_date"
                    type="date"
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailer_url">Trailer URL (YouTube) - Optional</Label>
                  <Input
                    id="trailer_url"
                    type="url"
                    value={formData.trailer_url}
                    onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Poster Image</Label>
                  
                  {/* Preview */}
                  {(previewUrl || formData.poster_url) && (
                    <div className="relative w-32 h-48 rounded-lg overflow-hidden border border-border group">
                      <img 
                        src={previewUrl || getImageUrl(formData.poster_url) || ''} 
                        alt="Poster preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <button
                        type="button"
                        onClick={clearPoster}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Upload button */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex-1"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </div>

                  {/* Or use URL */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or use URL</span>
                    </div>
                  </div>
                  
                  <Input
                    id="poster_url"
                    type="text"
                    value={formData.poster_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setFormData({ ...formData, poster_url: url });
                      // Convert relative URL to absolute for preview
                      const absoluteUrl = url && !url.startsWith('http') ? `${window.location.origin}${url}` : url;
                      setPreviewUrl(absoluteUrl || null);
                    }}
                    placeholder="https://... or /uploads/..."
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_released"
                    checked={formData.is_released}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_released: !!checked })}
                  />
                  <Label htmlFor="is_released" className="font-normal">Already Released</Label>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTrailer ? 'Update Trailer' : 'Add Trailer'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trailers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming trailers yet. Add your first one to get started.</p>
          </div>
        ) : filteredTrailers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trailers match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrailers.map((trailer) => (
                  <TableRow key={trailer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{trailer.title}</p>
                        {trailer.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                            {trailer.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(trailer.release_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="capitalize">{trailer.category.replace('-', ' ')}</TableCell>
                    <TableCell>
                      {trailer.is_released ? (
                        <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">Released</span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">Upcoming</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(trailer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(trailer.id)}>
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

export default AdminUpcomingTrailers;
