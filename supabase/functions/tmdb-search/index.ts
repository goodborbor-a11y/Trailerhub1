import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Input validation constants
const MAX_QUERY_LENGTH = 100;
const MIN_QUERY_LENGTH = 1;
const MAX_MOVIE_ID = 999999999;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
    if (!TMDB_API_KEY) {
      console.error('TMDB_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'TMDB API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with anon key and the user's auth header to get user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Invalid auth token:', authError?.message || 'Auth session missing!');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Create service role client to check admin status
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Error checking admin role:', roleError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData) {
      console.error('User is not an admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, query, movieId } = await req.json();
    
    // Input validation for action
    if (!action || typeof action !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate query parameter for search action
    if (action === 'search') {
      if (!query || typeof query !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Query parameter is required for search' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Query must be between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Validate movieId parameter for details action
    if (action === 'details') {
      const movieIdNum = Number(movieId);
      if (!movieId || !Number.isInteger(movieIdNum) || movieIdNum < 1 || movieIdNum > MAX_MOVIE_ID) {
        return new Response(
          JSON.stringify({ error: 'Invalid movie ID - must be a positive integer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('TMDB request by admin:', { action, userId: user.id, query: query?.substring(0, 20), movieId });

    if (action === 'search') {
      const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
      console.log('Searching TMDB for:', query);
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!response.ok) {
        console.error('TMDB search error:', data);
        throw new Error(data.status_message || 'TMDB search failed');
      }

      const movies = data.results.slice(0, 10).map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
        overview: movie.overview,
        rating: movie.vote_average,
      }));

      console.log(`Found ${movies.length} movies for admin ${user.id}`);
      return new Response(
        JSON.stringify({ movies }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'details') {
      const movieIdNum = Number(movieId);
      const detailsUrl = `${TMDB_BASE_URL}/movie/${movieIdNum}?api_key=${TMDB_API_KEY}&append_to_response=videos`;
      console.log('Fetching details for movie:', movieIdNum);
      
      const response = await fetch(detailsUrl);
      const movie = await response.json();

      if (!response.ok) {
        console.error('TMDB details error:', movie);
        throw new Error(movie.status_message || 'TMDB details fetch failed');
      }

      let trailer_url = null;
      if (movie.videos?.results) {
        const trailer = movie.videos.results.find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (trailer) {
          trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
      }

      const genreIds = movie.genres?.map((g: any) => g.id) || [];
      const countryCodes = movie.production_countries?.map((c: any) => c.iso_3166_1) || [];
      
      const europeanCountries = ['FR', 'DE', 'IT', 'ES', 'GB', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RO', 'GR', 'IE'];
      
      let category = 'hollywood';
      
      if (genreIds.includes(16)) {
        category = 'animation';
      } else if (genreIds.includes(53)) {
        category = 'thrillers';
      } else if (countryCodes.includes('IN')) {
        category = 'bollywood';
      } else if (countryCodes.includes('KR')) {
        category = 'korean';
      } else if (countryCodes.includes('CN') || countryCodes.includes('HK') || countryCodes.includes('TW')) {
        category = 'chinese';
      } else if (countryCodes.includes('NG')) {
        category = 'nollywood';
      } else if (countryCodes.some((c: string) => europeanCountries.includes(c)) && !countryCodes.includes('US')) {
        category = 'european';
      }
      
      console.log('Detected category:', category, 'from countries:', countryCodes, 'genres:', genreIds);

      const result = {
        id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear(),
        poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
        trailer_url,
        overview: movie.overview,
        rating: movie.vote_average,
        category,
        genres: movie.genres?.map((g: any) => g.name) || [],
        production_countries: countryCodes,
      };

      console.log('Movie details for admin', user.id, ':', result.title, 'trailer:', !!trailer_url);
      return new Response(
        JSON.stringify({ movie: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "search" or "details".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    console.error('TMDB function error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
