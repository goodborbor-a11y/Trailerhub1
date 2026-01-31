// ===========================================
// Custom API Client for Self-Hosted Backend
// ===========================================
// Replace the Supabase client with this when deploying to VPS
// ===========================================

// Use production URL in production, localhost in development
// Use production URL in production, localhost in development
// Use production URL in production, localhost in development
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = isLocal ? 'http://localhost:3001' : 'https://trailershub.org';

console.log('[API] Initialized with:', { hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A', isLocal, API_URL });

// Helper function to normalize image URLs (convert relative to absolute)
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Ensure relative URL starts with /
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${window.location.origin}${normalizedUrl}`;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.updateToken();
  }

  updateToken() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Always get fresh token
    this.updateToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${API_URL}${endpoint}`;
    console.log('API Request:', { method: options.method || 'GET', url, hasToken: !!this.token });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      console.log('API Response:', { status: response.status, statusText: response.statusText, url });

      // Try to parse JSON, but handle non-JSON responses gracefully
      let data: any;

      try {
        // Check content type first
        const contentType = response.headers.get('content-type') || '';

        // Get response text
        const text = await response.text();

        // Handle empty responses
        if (!text || text.trim() === '') {
          if (!response.ok) {
            return { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          return { data: {} };
        }

        // Try to parse as JSON
        try {
          data = JSON.parse(text);
        } catch (parseError: any) {
          // If response is not JSON, check if it's an error
          if (!response.ok) {
            // Check if it's HTML (common for 405/404 errors from Nginx)
            if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
              return { error: `HTTP ${response.status}: ${response.statusText} - Server returned HTML instead of JSON. Check Nginx configuration.` };
            }
            return { error: `HTTP ${response.status}: ${response.statusText} - ${text.substring(0, 100)}` };
          }
          console.error('Failed to parse response as JSON:', parseError, 'Response text:', text.substring(0, 200));
          return { error: `Invalid response format: ${text.substring(0, 100)}` };
        }
      } catch (error: any) {
        console.error('Error reading response:', error);
        if (!response.ok) {
          return { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        return { error: 'Failed to read response' };
      }

      if (!response.ok) {
        return { error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}` };
      }

      // Return the data directly (backend already wraps it)
      return { data };
    } catch (error: any) {
      console.error('API request error:', error);
      return { error: error.message || 'Network error' };
    }
  }

  // Auth methods
  async signUp(email: string, password: string, displayName?: string) {
    const result = await this.request<{ user: any; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });

    // Backend returns { user: {...}, token: "..." } directly
    if (result.data) {
      const token = (result.data as any).token;
      if (token) {
        this.token = token;
        localStorage.setItem('token', token);
      }
    }

    return result;
  }

  async signIn(email: string, password: string) {
    const result = await this.request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Backend returns { user: {...}, token: "..." } directly
    // The request method wraps it as { data: { user: {...}, token: "..." } }
    if (result.data) {
      const responseData = result.data as any;
      const token = responseData.token;
      if (token) {
        this.token = token;
        localStorage.setItem('token', token);
      }
    } else if (result.error) {
      console.error('Login error:', result.error);
    }

    return result;
  }

  async signOut() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('token');
  }

  async getCurrentUser() {
    console.log('getCurrentUser called', {
      hasToken: !!this.token,
      tokenLength: this.token?.length,
      apiUrl: API_URL
    });
    const result = await this.request<{ user: any }>('/api/auth/me');
    console.log('getCurrentUser result:', {
      hasData: !!result.data,
      hasError: !!result.error,
      error: result.error
    });
    return result;
  }

  private cleanMovieId(id: string): string {
    return id.toString().replace('db-', '');
  }

  // Movies
  async getMovies(params?: {
    category?: string;
    featured?: boolean;
    trending?: boolean;
    latest?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    return this.request<{ movies: any[] }>(`/api/movies?${searchParams}`);
  }

  async getMovie(id: string) {
    return this.request<{ movie: any }>(`/api/movies/${this.cleanMovieId(id)}`);
  }

  async createMovie(movie: any) {
    return this.request<{ movie: any }>('/api/movies', {
      method: 'POST',
      body: JSON.stringify(movie),
    });
  }

  async updateMovie(id: string, movie: any) {
    return this.request<{ movie: any }>(`/api/movies/${this.cleanMovieId(id)}`, {
      method: 'PUT',
      body: JSON.stringify(movie),
    });
  }

  async deleteMovie(id: string) {
    return this.request(`/api/movies/${this.cleanMovieId(id)}`, { method: 'DELETE' });
  }

  // Watchlist
  async getWatchlist() {
    return this.request<{ watchlist: any[] }>('/api/watchlist');
  }

  async addToWatchlist(movieId: string, isFavorite = false, guestIdentifier?: string) {
    return this.request<{ item: any }>('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({
        movie_id: this.cleanMovieId(movieId),
        is_favorite: isFavorite,
        guest_identifier: guestIdentifier
      }),
    });
  }

  async removeFromWatchlist(movieId: string) {
    return this.request(`/api/watchlist/${this.cleanMovieId(movieId)}`, { method: 'DELETE' });
  }

  // Ratings
  async getUserRatings() {
    return this.request<{ ratings: any[] }>('/api/ratings');
  }

  async getMovieRatings(movieId: string) {
    return this.request<{ ratings: any[] }>(`/api/ratings/${this.cleanMovieId(movieId)}`);
  }

  async submitRating(movieId: string, rating: number, review?: string, guestIdentifier?: string) {
    return this.request<{ rating: any }>('/api/ratings', {
      method: 'POST',
      body: JSON.stringify({
        movie_id: this.cleanMovieId(movieId),
        rating,
        review,
        guest_identifier: guestIdentifier
      }),
    });
  }

  async deleteRating(id: string) {
    return this.request(`/api/ratings/${id}`, { method: 'DELETE' });
  }

  // Comments methods
  async getComments(movieId: string) {
    const result = await this.request<{ comments: any[] }>(`/api/comments/${this.cleanMovieId(movieId)}`);

    // Fallback for demo/dev purposes if backend is down
    if (result.error) {
      console.warn('[API] Fetching comments failed, using mock data:', result.error);
      return {
        data: {
          comments: [
            {
              id: 'mock-1',
              movie_id: this.cleanMovieId(movieId),
              author_name: 'TrailersHub Bot',
              content: 'The backend database is currently unreachable, but you can still browse the trailers! This is a fallback message.',
              created_at: new Date().toISOString(),
              like_count: 5,
              replies: []
            }
          ]
        }
      };
    }

    return result;
  }

  async createComment(movieId: string, content: string, parentCommentId?: string, authorName?: string, guestIdentifier?: string) {
    return this.request<{ comment: any }>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        movie_id: this.cleanMovieId(movieId),
        content,
        parent_comment_id: parentCommentId,
        author_name: authorName,
        guest_identifier: guestIdentifier
      }),
    });
  }

  async likeComment(commentId: string, guestIdentifier?: string) {
    return this.request<{ liked: boolean; like_count: number }>(`/api/comments/${commentId}/like`, {
      method: 'POST',
      body: JSON.stringify({ guest_identifier: guestIdentifier }),
    });
  }

  // Categories
  async getCategories() {
    return this.request<{ categories: any[] }>('/api/categories');
  }

  // File upload
  async uploadFile(file: File) {
    // Always get fresh token
    this.updateToken();

    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    const url = `${API_URL}/api/upload`;
    console.log('Upload Request:', { method: 'POST', url, hasToken: !!this.token, fileName: file.name, fileSize: file.size });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
        // Add signal for timeout handling
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      console.log('Upload Response:', { status: response.status, statusText: response.statusText, url, ok: response.ok });

      // Check content type first
      const contentType = response.headers.get('content-type') || '';

      // Get response text
      const text = await response.text();

      // Handle empty responses
      if (!text || text.trim() === '') {
        if (!response.ok) {
          return { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        return { error: 'Empty response from server' };
      }

      // Check if response is HTML (error page)
      if (text.trim().startsWith('<!') || text.trim().startsWith('<html') || !contentType.includes('application/json')) {
        console.error('Upload failed: Server returned HTML instead of JSON', text.substring(0, 200));
        return { error: 'Upload endpoint not found. Check Nginx configuration.' };
      }

      // Try to parse as JSON
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseError: any) {
        console.error('Failed to parse upload response as JSON:', parseError, 'Response text:', text.substring(0, 200));
        return { error: `Invalid response format: ${text.substring(0, 100)}` };
      }

      if (!response.ok) {
        return { error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}` };
      }

      return { data };
    } catch (error: any) {
      console.error('Upload request error:', error);

      // Handle specific error types
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return { error: 'Upload timeout. File may be too large or connection is slow.' };
      }

      if (error.message === 'Failed to fetch') {
        return { error: 'Network error: Could not connect to server. Check your connection and try again.' };
      }

      if (error.message.includes('CORS') || error.message.includes('CORS policy')) {
        return { error: 'CORS error: Server configuration issue. Please contact administrator.' };
      }

      return { error: error.message || 'Network error during upload' };
    }
  }

  // Favicon upload - generates all sizes
  async uploadFavicon(file: File) {
    // Always get fresh token
    this.updateToken();

    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${API_URL}/api/upload/favicon`;
    console.log('Favicon Upload Request:', { method: 'POST', url, hasToken: !!this.token, fileName: file.name, fileSize: file.size });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
        signal: AbortSignal.timeout(60000), // 60 second timeout for processing
      });

      console.log('Favicon Upload Response:', { status: response.status, statusText: response.statusText, url, ok: response.ok });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (!text || text.trim() === '') {
        if (!response.ok) {
          return { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        return { error: 'Empty response from server' };
      }

      if (text.trim().startsWith('<!') || text.trim().startsWith('<html') || !contentType.includes('application/json')) {
        console.error('Favicon upload failed: Server returned HTML instead of JSON', text.substring(0, 200));
        return { error: 'Favicon upload endpoint not found. Check Nginx configuration.' };
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseError: any) {
        console.error('Failed to parse favicon upload response as JSON:', parseError, 'Response text:', text.substring(0, 200));
        return { error: `Invalid response format: ${text.substring(0, 100)}` };
      }

      if (!response.ok) {
        return { error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}` };
      }

      return { data };
    } catch (error: any) {
      console.error('Favicon upload request error:', error);

      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return { error: 'Favicon upload timeout. File may be too large or processing is slow.' };
      }

      if (error.message === 'Failed to fetch') {
        return { error: 'Network error: Could not connect to server. Check your connection and try again.' };
      }

      return { error: error.message || 'Network error during favicon upload' };
    }
  }

  // Admin methods
  async getAdminStats() {
    return this.request<{ movies: number; comments: number; subscribers: number; users: number }>('/api/admin/stats');
  }

  async getAdminUsers() {
    return this.request<{ users: any[] }>('/api/admin/users');
  }

  async subscribeNewsletter(email: string) {
    return this.request<{ success: boolean; message: string; subscriber: any }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getNewsletterSubscribers() {
    return this.request<{ subscribers: any[] }>('/api/admin/newsletter');
  }

  async deleteNewsletterSubscriber(id: string) {
    return this.request(`/api/admin/newsletter/${id}`, { method: 'DELETE' });
  }

  async getAllRatings() {
    return this.request<{ ratings: any[] }>('/api/admin/ratings');
  }

  async getAdminComments() {
    return this.request<{ comments: any[] }>('/api/admin/comments');
  }

  async deleteAdminComment(id: string) {
    return this.request(`/api/admin/comments/${id}`, { method: 'DELETE' });
  }

  async createCategory(category: { name: string; slug?: string; description?: string }) {
    return this.request<{ category: any }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: { name: string; slug?: string; description?: string }) {
    return this.request<{ category: any }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/api/categories/${id}`, { method: 'DELETE' });
  }

  // TMDB methods
  async searchTMDB(query: string) {
    return this.request<{ movies: any[] }>('/api/tmdb/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async getTMDBDetails(movieId: number, mediaType?: string) {
    return this.request<{ movie: any }>('/api/tmdb/details', {
      method: 'POST',
      body: JSON.stringify({ movieId, mediaType }),
    });
  }

  // Additional admin methods
  async getAdminAnalytics() {
    return this.request<{ popularMovies: any[]; alerts: any[] }>('/api/admin/analytics');
  }

  async getAdminVisitors() {
    return this.request<{
      dailyData: any[];
      weeklyData: any[];
      monthlyData: any[];
      yearlyData: any[];
      stats: { todayVisitors: number; weekVisitors: number; monthVisitors: number; yearVisitors: number }
    }>('/api/admin/visitors');
  }

  // Public upcoming trailers (for homepage)
  async getUpcomingTrailers() {
    return this.request<{ trailers: any[] }>('/api/upcoming');
  }

  // Admin upcoming trailers
  async getAdminUpcomingTrailers() {
    return this.request<{ trailers: any[] }>('/api/admin/upcoming');
  }

  async createUpcomingTrailer(trailer: any) {
    return this.request<{ trailer: any }>('/api/admin/upcoming', {
      method: 'POST',
      body: JSON.stringify(trailer),
    });
  }

  async updateUpcomingTrailer(id: string, trailer: any) {
    return this.request<{ trailer: any }>(`/api/admin/upcoming/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trailer),
    });
  }

  async deleteUpcomingTrailer(id: string) {
    return this.request(`/api/admin/upcoming/${id}`, { method: 'DELETE' });
  }

  async getLoginHistory() {
    return this.request<{ history: any[] }>('/api/admin/login-history');
  }

  async getSecurityUsers() {
    return this.request<{ users: any[] }>('/api/admin/security/users');
  }

  async suspendUser(userId: string, reason: string) {
    return this.request(`/api/admin/security/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unsuspendUser(userId: string) {
    return this.request(`/api/admin/security/users/${userId}/unsuspend`, {
      method: 'POST',
    });
  }

  async getSiteSettings() {
    return this.request<{ settings: any }>('/api/admin/settings');
  }

  async updateSiteSettings(settings: any) {
    return this.request<{ settings: any }>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();
export default api;
