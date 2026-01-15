import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle, XCircle, FileJson, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const exampleJson = `[
  {
    "title": "Movie Title",
    "year": 2024,
    "trailer_url": "https://youtube.com/watch?v=...",
    "poster_url": "https://example.com/poster.jpg",
    "category": "hollywood",
    "is_featured": false,
    "is_trending": false,
    "is_latest": true
  }
]`;

const AdminBulkImport = () => {
  const [jsonData, setJsonData] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('hollywood');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const categories = [
    'hollywood', 'nollywood', 'bollywood', 'korean', 
    'anime', 'chinese', 'european', 'thrillers', 'tv-series'
  ];

  const validateMovie = (movie: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!movie.title || typeof movie.title !== 'string') {
      errors.push(`Row ${index + 1}: Missing or invalid title`);
    }
    if (!movie.year || typeof movie.year !== 'number' || movie.year < 1900 || movie.year > 2100) {
      errors.push(`Row ${index + 1}: Invalid year (must be 1900-2100)`);
    }
    if (!movie.trailer_url || typeof movie.trailer_url !== 'string') {
      errors.push(`Row ${index + 1}: Missing or invalid trailer_url`);
    }
    
    return errors;
  };

  const handleImport = async () => {
    setResult(null);
    
    let movies: any[];
    try {
      movies = JSON.parse(jsonData);
      if (!Array.isArray(movies)) {
        toast({ title: 'Error', description: 'JSON must be an array of movies', variant: 'destructive' });
        return;
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Invalid JSON format', variant: 'destructive' });
      return;
    }

    if (movies.length === 0) {
      toast({ title: 'Error', description: 'No movies to import', variant: 'destructive' });
      return;
    }

    // Validate all movies first
    const validationErrors: string[] = [];
    movies.forEach((movie, index) => {
      validationErrors.push(...validateMovie(movie, index));
    });

    if (validationErrors.length > 0) {
      setResult({
        success: 0,
        failed: movies.length,
        errors: validationErrors.slice(0, 10),
      });
      return;
    }

    setImporting(true);
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      try {
        const result = await api.createMovie({
          title: movie.title,
          year: movie.year,
          trailer_url: movie.trailer_url,
          poster_url: movie.poster_url || null,
          category: movie.category || defaultCategory,
          is_featured: movie.is_featured || false,
          is_trending: movie.is_trending || false,
          is_latest: movie.is_latest || false,
        });

        if (result.error) {
          throw error;
        }
        success++;
      } catch (err: any) {
        failed++;
        errors.push(`Row ${i + 1} (${movie.title}): ${err.message}`);
      }
    }

    setImporting(false);
    setResult({ success, failed, errors: errors.slice(0, 10) });

    if (success > 0) {
      toast({ 
        title: 'Import Complete', 
        description: `Successfully imported ${success} movie(s)` 
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonData(content);
    };
    reader.readAsText(file);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulk Import</h1>
          <p className="text-muted-foreground">Import multiple movies at once using JSON</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Movies
              </CardTitle>
              <CardDescription>
                Paste JSON data or upload a JSON file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="json">Movie Data (JSON Array)</Label>
                <Textarea
                  id="json"
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder={exampleJson}
                  className="font-mono text-sm min-h-[300px]"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="category">Default Category</Label>
                  <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                    <SelectTrigger>
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
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Or Upload File</Label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90"
                  />
                </div>
              </div>

              <Button 
                onClick={handleImport} 
                disabled={importing || !jsonData.trim()}
                className="w-full"
              >
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import Movies
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  JSON Format
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {exampleJson}
                </pre>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-medium">Required fields:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><code className="text-foreground">title</code> - Movie title (string)</li>
                    <li><code className="text-foreground">year</code> - Release year (number)</li>
                    <li><code className="text-foreground">trailer_url</code> - YouTube URL (string)</li>
                  </ul>
                  <p className="font-medium mt-4">Optional fields:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><code className="text-foreground">poster_url</code> - Poster image URL</li>
                    <li><code className="text-foreground">category</code> - Movie category</li>
                    <li><code className="text-foreground">is_featured</code> - Featured flag</li>
                    <li><code className="text-foreground">is_trending</code> - Trending flag</li>
                    <li><code className="text-foreground">is_latest</code> - Latest flag</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card className={result.failed > 0 ? 'border-destructive/50' : 'border-green-500/50'}>
                <CardHeader>
                  <CardTitle>Import Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">{result.success} Successful</span>
                    </div>
                    {result.failed > 0 && (
                      <div className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">{result.failed} Failed</span>
                      </div>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {result.errors.map((err, i) => (
                            <li key={i} className="text-sm">{err}</li>
                          ))}
                        </ul>
                        {result.errors.length === 10 && (
                          <p className="mt-2 text-sm italic">Showing first 10 errors...</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBulkImport;
