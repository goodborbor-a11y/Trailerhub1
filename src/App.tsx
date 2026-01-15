import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { PinchZoomWrapper } from "@/components/PinchZoomWrapper";
import { FaviconInjector } from "@/components/FaviconInjector";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Watchlist from "./pages/Watchlist";
import Favorites from "./pages/Favorites";
import MyReviews from "./pages/MyReviews";
import Movies from "./pages/Movies";
import Upcoming from "./pages/Upcoming";
import Trending from "./pages/Trending";
import Categories from "./pages/Categories";
import Watch from "./pages/Watch";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBulkImport from "./pages/admin/AdminBulkImport";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLoginHistory from "./pages/admin/AdminLoginHistory";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminTMDBImport from "./pages/admin/AdminTMDBImport";
import AdminVisitors from "./pages/admin/AdminVisitors";
import AdminUpcomingTrailers from "./pages/admin/AdminUpcomingTrailers";
import AdminGeneralSettings from "./pages/admin/AdminGeneralSettings";

const queryClient = new QueryClient();

const App = () => {
  const [faviconUrls, setFaviconUrls] = useState<Record<string, string> | null>(null);

  // Debug: Log that routes are being registered
  useEffect(() => {
    console.log('[App] Routes registered:', {
      movies: typeof Movies !== 'undefined',
      upcoming: typeof Upcoming !== 'undefined',
      trending: typeof Trending !== 'undefined',
      categories: typeof Categories !== 'undefined',
    });
  }, []);

  useEffect(() => {
    // Fetch favicon settings on app load (public endpoint, no auth required)
    const fetchFavicons = async () => {
      try {
        console.log('[App] Starting favicon fetch...');
        // Use robust API URL logic (FORCE relative paths when not on localhost)
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const API_URL = isLocal ? 'http://localhost:3001' : '';
        const faviconUrl = `${API_URL}/api/settings/favicon`;

        console.log('[App] Probed API URL:', { hostname: window.location.hostname, isLocal, API_URL, faviconUrl });
        const response = await fetch(faviconUrl, {
          method: 'GET',
          credentials: 'include',
        });

        console.log('[App] Favicon fetch response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[App] Favicon data received:', data);
          if (data?.favicon_urls && Object.keys(data.favicon_urls).length > 0) {
            const timestamp = Date.now();
            const urlsWithCacheBuster = Object.fromEntries(
              Object.entries(data.favicon_urls).map(([size, url]) => [size, `${url}?v=${timestamp}`])
            );
            console.log('[App] Setting favicon URLs:', urlsWithCacheBuster);
            setFaviconUrls(urlsWithCacheBuster);
          } else {
            console.warn('[App] No favicon_urls in response data');
          }
        } else {
          const errorText = await response.text();
          console.error('[App] Failed to fetch favicon settings:', response.status, errorText);
        }
      } catch (error) {
        console.error('[App] Error in fetchFavicons:', error);
      }
    };
    fetchFavicons();

    // Listen for custom favicon update events (e.g., from Admin panel)
    const handleUpdate = () => {
      console.log('[App] Favicon-updated event detected! Re-fetching...');
      fetchFavicons();
    };

    window.addEventListener('favicon-updated', handleUpdate);
    return () => window.removeEventListener('favicon-updated', handleUpdate);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <PinchZoomWrapper>
                <FaviconInjector faviconUrls={faviconUrls} />
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/my-reviews" element={<MyReviews />} />
                    <Route path="/movies" element={<Movies />} />
                    <Route path="/upcoming" element={<Upcoming />} />
                    <Route path="/trending" element={<Trending />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/watch/:id" element={<Watch />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/visitors" element={<AdminVisitors />} />
                    <Route path="/admin/movies" element={<AdminMovies />} />
                    <Route path="/admin/tmdb-import" element={<AdminTMDBImport />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/bulk-import" element={<AdminBulkImport />} />
                    <Route path="/admin/reviews" element={<AdminReviews />} />
                    <Route path="/admin/newsletter" element={<AdminNewsletter />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/login-history" element={<AdminLoginHistory />} />
                    <Route path="/admin/security" element={<AdminSecurity />} />
                    <Route path="/admin/upcoming" element={<AdminUpcomingTrailers />} />
                    <Route path="/admin/general-settings" element={<AdminGeneralSettings />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </PinchZoomWrapper>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
