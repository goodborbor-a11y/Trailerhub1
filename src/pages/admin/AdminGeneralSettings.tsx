import { useState, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api, { getImageUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Upload, Settings, Save, Image, Loader2, X } from 'lucide-react';

interface SiteSettings {
  site_name: string;
  tagline: string;
  site_logo_url: string | null;
  favicon_urls: Record<string, string> | null;
  about_text: string;
  copyright_text: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const AdminGeneralSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'TrailersHub',
    tagline: 'Your Ultimate Destination for Movie Trailers',
    site_logo_url: null,
    favicon_urls: null,
    about_text: 'TrailersHub is your ultimate destination for movie trailers from around the world.',
    copyright_text: '© 2025 TrailersHub. All rights reserved.',
  });
  const [originalSettings, setOriginalSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const result = await api.getSiteSettings();
      if (result.error) {
        console.error('Error fetching settings:', result.error);
        // Use defaults if error
      } else if (result.data?.settings) {
        setSettings(result.data.settings);
        setOriginalSettings(result.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const result = await api.updateSiteSettings(settings);
      if (result.error) {
        throw new Error(result.error);
      }
      setOriginalSettings(settings);
      toast({ title: 'Settings saved successfully!' });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 2MB.',
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload PNG, JPG, or SVG file.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const uploadResult = await api.uploadFavicon(file);
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }
      const faviconUrls = uploadResult.data?.favicons || {};
      const updatedSettings = { ...settings, favicon_urls: faviconUrls };
      setSettings(updatedSettings);
      setOriginalSettings(updatedSettings); // Mark as saved since backend auto-saves

      // Dispatch custom event to trigger favicon refresh across the app
      window.dispatchEvent(new CustomEvent('favicon-updated'));

      toast({
        title: 'Favicon uploaded and saved!',
        description: 'All sizes (16x16 to 256x256) have been generated and saved.'
      });
    } catch (error: any) {
      console.error('Error uploading favicon:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload favicon.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFaviconUpload(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleRemoveFavicon = () => {
    setSettings(prev => ({ ...prev, favicon_urls: null }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Site Settings</h1>
            <p className="text-muted-foreground">Configure your website settings</p>
          </div>
          <Button
            onClick={handleSaveChanges}
            disabled={saving || !hasChanges()}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* General Section */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General
              </CardTitle>
              <CardDescription>Basic site information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Site Name */}
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={settings.site_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                  placeholder="Enter website name"
                  className="bg-background"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.tagline}
                  onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Your website tagline"
                  className="bg-background"
                />
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <Label>Favicon</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload an image to generate favicons for all sizes (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
                </p>
                {settings.favicon_urls ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border border-border">
                      <div className="flex-shrink-0">
                        <img
                          src={`${getImageUrl(settings.favicon_urls['256x256'] || settings.favicon_urls['128x128'] || settings.favicon_urls['64x64'] || Object.values(settings.favicon_urls)[0]) || ''}?t=${Date.now()}`}
                          alt="Favicon preview"
                          className="w-16 h-16 object-contain rounded"
                          onError={(e) => {
                            // Fallback to a smaller size if the current one fails
                            const target = e.target as HTMLImageElement;
                            const fallbackUrl = settings.favicon_urls['32x32'] || settings.favicon_urls['16x16'];
                            if (fallbackUrl) {
                              const newSrc = `${getImageUrl(fallbackUrl)}?t=${Date.now()}`;
                              if (target.src !== newSrc) {
                                target.src = newSrc;
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Favicon uploaded</p>
                        <p className="text-xs text-muted-foreground">
                          All sizes generated (16x16 to 256x256)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Replace Favicon
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFavicon}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your favicon image here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, SVG up to 2MB (will generate all sizes automatically)
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFaviconUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer Section */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Footer</CardTitle>
              <CardDescription>Customize footer content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* About Text */}
              <div className="space-y-2">
                <Label htmlFor="about-text">About Text</Label>
                <Textarea
                  id="about-text"
                  value={settings.about_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, about_text: e.target.value }))}
                  placeholder="Brief description for footer"
                  className="bg-background min-h-[100px] resize-none"
                />
              </div>

              {/* Copyright Text */}
              <div className="space-y-2">
                <Label htmlFor="copyright-text">Copyright Text</Label>
                <Input
                  id="copyright-text"
                  value={settings.copyright_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, copyright_text: e.target.value }))}
                  placeholder="© 2025 Your Site. All rights reserved."
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGeneralSettings;
