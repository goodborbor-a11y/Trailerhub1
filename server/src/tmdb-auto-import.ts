/**
 * TMDB Auto-Import Script
 *
 * Automatically imports recent movies from TMDB with strict trailer validation.
 * Follows rules defined in PROJECT_AUTOMATION.md.
 *
 * Usage:
 *   npx ts-node src/tmdb-auto-import.ts [options]
 *
 * Options:
 *   --days=7           Number of days back to scan (default: 7)
 *   --future-window=90 Skip movies releasing more than N days in the future (default: 90)
 *   --dry-run          Preview what would be imported without writing to DB
 *   --pages=10         Number of TMDB discover pages to fetch (default: 10)
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── CONFIG ──────────────────────────────────────────────

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Junk trailer keywords (case-insensitive)
const JUNK_KEYWORDS = [
  'concept', 'fan', 'edit', 'parody', 'fake',
  'reaction', 'remake', 'leak', 'unofficial'
];

// ─── CLI ARGUMENT PARSING ────────────────────────────────

function parseArgs(): { days: number; futureWindow: number; dryRun: boolean; pages: number } {
  // Check all of process.argv for flags (works whether invoked via ts-node, node -e, etc.)
  const allArgs = process.argv.join(' ');
  let days = 7;
  let futureWindow = 90;
  let dryRun = false;
  let pages = 10;

  const daysMatch = allArgs.match(/--days=(\d+)/);
  if (daysMatch) days = parseInt(daysMatch[1], 10) || 7;

  const futureMatch = allArgs.match(/--future-window=(\d+)/);
  if (futureMatch) futureWindow = parseInt(futureMatch[1], 10) || 90;

  if (allArgs.includes('--dry-run')) dryRun = true;

  const pagesMatch = allArgs.match(/--pages=(\d+)/);
  if (pagesMatch) pages = parseInt(pagesMatch[1], 10) || 3;

  // Also check env vars (useful for cron)
  if (process.env.IMPORT_DAYS) days = parseInt(process.env.IMPORT_DAYS, 10) || days;
  if (process.env.IMPORT_FUTURE_WINDOW) futureWindow = parseInt(process.env.IMPORT_FUTURE_WINDOW, 10) || futureWindow;
  if (process.env.IMPORT_DRY_RUN === 'true') dryRun = true;
  if (process.env.IMPORT_PAGES) pages = parseInt(process.env.IMPORT_PAGES, 10) || pages;

  return { days, futureWindow, dryRun, pages };
}

// ─── TRAILER VALIDATION (Strict per PROJECT_AUTOMATION.md) ─

interface TMDBVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
  published_at?: string;
}

function isJunkTrailer(name: string): boolean {
  const lower = name.toLowerCase();
  return JUNK_KEYWORDS.some(kw => lower.includes(kw));
}

function findValidTrailer(videos: TMDBVideo[]): string | null {
  // Filter to valid candidates
  const candidates = videos.filter(v => {
    if (v.site !== 'YouTube') return false;
    if (v.type !== 'Trailer') return false;
    if (v.official === false) return false; // explicit false = skip
    if (isJunkTrailer(v.name || '')) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  // Priority 1: Name contains "Official Trailer"
  const officialNamed = candidates.find(v =>
    (v.name || '').toLowerCase().includes('official trailer')
  );
  if (officialNamed) return `https://www.youtube.com/watch?v=${officialNamed.key}`;

  // Priority 2: Marked as official
  const officialMarked = candidates.find(v => v.official === true);
  if (officialMarked) return `https://www.youtube.com/watch?v=${officialMarked.key}`;

  // Priority 3: First remaining candidate (clearly not junk, is a Trailer on YouTube)
  return `https://www.youtube.com/watch?v=${candidates[0].key}`;
}

// ─── CATEGORY DETECTION (Reuses existing server logic) ────

function detectCategory(
  detailsData: any,
  isTV: boolean
): string {
  const genres: any[] = detailsData.genres || [];
  const genreIds = genres.map((g: any) => g.id);
  const originalLanguage = (detailsData.original_language || '').toLowerCase();

  const productionCountries = isTV
    ? (detailsData.origin_country || []).map((c: string) => c.toUpperCase())
    : (detailsData.production_countries || []).map((c: any) => c.iso_3166_1.toUpperCase());
  const countryCodes: string[] = Array.isArray(productionCountries) ? productionCountries : [];

  if (isTV) return 'tv-series';
  if (genreIds.includes(16)) return 'animation';
  if (originalLanguage === 'hi' || countryCodes.includes('IN')) return 'bollywood';
  if (countryCodes.includes('NG')) return 'nollywood';
  if (originalLanguage === 'ko' || countryCodes.includes('KR')) return 'korean';
  if (originalLanguage === 'zh' || countryCodes.some(c => ['CN', 'HK', 'TW'].includes(c))) return 'chinese';
  if (
    (countryCodes.some(c => ['FR', 'IT', 'DE', 'ES', 'GB'].includes(c)) && !countryCodes.includes('US')) ||
    ['fr', 'it', 'de', 'es'].includes(originalLanguage)
  ) return 'european';

  return 'hollywood';
}

// ─── TMDB API HELPERS ─────────────────────────────────────

async function fetchJSON(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TMDB API error (${response.status}): ${text}`);
  }
  return response.json();
}

async function discoverMovies(dateFrom: string, dateTo: string, page: number): Promise<any[]> {
  const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}` +
    `&sort_by=popularity.desc` +
    `&primary_release_date.gte=${dateFrom}` +
    `&primary_release_date.lte=${dateTo}` +
    `&page=${page}`;
  const data = await fetchJSON(url);
  return data.results || [];
}

async function discoverTV(dateFrom: string, dateTo: string, page: number): Promise<any[]> {
  const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}` +
    `&sort_by=popularity.desc` +
    `&first_air_date.gte=${dateFrom}` +
    `&first_air_date.lte=${dateTo}` +
    `&page=${page}`;
  const data = await fetchJSON(url);
  return data.results || [];
}

async function getDetails(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<any> {
  const url = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
  return fetchJSON(url);
}

async function getVideos(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TMDBVideo[]> {
  const url = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}/videos?api_key=${TMDB_API_KEY}`;
  const data = await fetchJSON(url);
  return data.results || [];
}

// ─── DATE HELPERS ─────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ─── MAIN ─────────────────────────────────────────────────

async function main() {
  const { days, futureWindow, dryRun, pages } = parseArgs();

  console.log('===========================================');
  console.log('  TMDB Auto-Import');
  console.log('===========================================');
  console.log(`  Mode:          ${dryRun ? 'DRY RUN (no DB writes)' : 'LIVE'}`);
  console.log(`  Days back:     ${days}`);
  console.log(`  Future window: ${futureWindow} days`);
  console.log(`  Pages/type:    ${pages}`);
  console.log('===========================================\n');

  if (!TMDB_API_KEY) {
    console.error('ERROR: TMDB_API_KEY not set in environment');
    process.exit(1);
  }
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not set in environment');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  // Ensure tmdb_id column exists
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'movies' AND column_name = 'tmdb_id'
        ) THEN
          ALTER TABLE movies ADD COLUMN tmdb_id INTEGER;
          CREATE UNIQUE INDEX idx_movies_tmdb_id ON movies(tmdb_id) WHERE tmdb_id IS NOT NULL;
        END IF;
      END $$;
    `);
  } catch (err: any) {
    console.error('Warning: Could not ensure tmdb_id column:', err.message);
  }

  // Get existing tmdb_ids to skip
  const existingResult = await pool.query('SELECT tmdb_id FROM movies WHERE tmdb_id IS NOT NULL');
  const existingTmdbIds = new Set(existingResult.rows.map(r => r.tmdb_id));
  console.log(`Found ${existingTmdbIds.size} existing movies with tmdb_id in database.\n`);

  // Also check existing titles for extra safety (for movies imported before tmdb_id was added)
  const existingTitlesResult = await pool.query('SELECT LOWER(title) as title FROM movies');
  const existingTitles = new Set(existingTitlesResult.rows.map(r => r.title));

  // Date range
  const dateFrom = formatDate(daysFromNow(-days));
  const dateTo = formatDate(daysFromNow(futureWindow));
  const futureLimit = daysFromNow(futureWindow);

  console.log(`Scanning TMDB: ${dateFrom} to ${dateTo}\n`);

  // Collect candidates from discover endpoints
  const candidates: Array<{ id: number; mediaType: 'movie' | 'tv'; title: string }> = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const movies = await discoverMovies(dateFrom, dateTo, page);
      for (const m of movies) {
        candidates.push({ id: m.id, mediaType: 'movie', title: m.title || 'Unknown' });
      }
    } catch (err: any) {
      console.error(`Error fetching movie page ${page}:`, err.message);
    }

    try {
      const tvShows = await discoverTV(dateFrom, dateTo, page);
      for (const t of tvShows) {
        candidates.push({ id: t.id, mediaType: 'tv', title: t.name || 'Unknown' });
      }
    } catch (err: any) {
      console.error(`Error fetching TV page ${page}:`, err.message);
    }
  }

  console.log(`Found ${candidates.length} candidates from TMDB discover.\n`);

  // Process each candidate
  let totalChecked = 0;
  let totalSkipped = 0;
  let totalImported = 0;
  let skippedReasons: Record<string, number> = {};

  const skip = (reason: string, title: string) => {
    totalSkipped++;
    skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
    console.log(`  SKIP: "${title}" — ${reason}`);
  };

  for (const candidate of candidates) {
    totalChecked++;

    // 1. Dedup by tmdb_id
    if (existingTmdbIds.has(candidate.id)) {
      skip('already in DB (tmdb_id)', candidate.title);
      continue;
    }

    // 2. Rate limit: small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 250));

    try {
      // 3. Get full details
      const details = await getDetails(candidate.id, candidate.mediaType);
      const title = details.title || details.name || candidate.title;

      // 4. Dedup by title (fallback for pre-existing movies)
      if (existingTitles.has(title.toLowerCase())) {
        skip('already in DB (title match)', title);
        continue;
      }

      // 5. Future release check
      const releaseDateStr = details.release_date || details.first_air_date;
      if (releaseDateStr) {
        const releaseDate = new Date(releaseDateStr);
        if (releaseDate > futureLimit) {
          skip(`too far in the future (${releaseDateStr})`, title);
          continue;
        }
      }

      // 6. Get videos and validate trailer
      const videos = await getVideos(candidate.id, candidate.mediaType);
      const trailerUrl = findValidTrailer(videos);

      if (!trailerUrl) {
        skip('no valid trailer found', title);
        continue;
      }

      // 7. Determine category
      const isTV = candidate.mediaType === 'tv';
      const category = detectCategory(details, isTV);

      // 8. Extract fields
      const year = releaseDateStr ? new Date(releaseDateStr).getFullYear() : new Date().getFullYear();
      const posterUrl = details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null;
      const isLatest = year >= new Date().getFullYear();

      // 9. Insert or skip (dry-run)
      if (dryRun) {
        console.log(`  WOULD IMPORT: "${title}" (${year}) [${category}] — ${trailerUrl}`);
        totalImported++;
      } else {
        try {
          // Check tmdb_id doesn't already exist (belt-and-suspenders with the Set check above)
          const existsCheck = await pool.query(
            'SELECT id FROM movies WHERE tmdb_id = $1', [candidate.id]
          );
          if (existsCheck.rows.length > 0) {
            console.log(`  SKIP (late dedup): "${title}" already in DB`);
            totalSkipped++;
            continue;
          }

          await pool.query(
            `INSERT INTO movies
             (title, year, category, poster_url, trailer_url, is_featured, is_trending, is_latest, tmdb_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, false, false, $6, $7, NOW(), NOW())`,
            [title, year, category, posterUrl, trailerUrl, isLatest, candidate.id]
          );
          console.log(`  IMPORTED: "${title}" (${year}) [${category}]`);
          totalImported++;
          existingTmdbIds.add(candidate.id);
          existingTitles.add(title.toLowerCase());
        } catch (dbErr: any) {
          console.error(`  DB ERROR for "${title}":`, dbErr.message);
        }
      }
    } catch (err: any) {
      console.error(`  API ERROR for "${candidate.title}" (ID: ${candidate.id}):`, err.message);
      totalSkipped++;
    }
  }

  // Summary
  console.log('\n===========================================');
  console.log('  IMPORT SUMMARY');
  console.log('===========================================');
  console.log(`  Total checked:  ${totalChecked}`);
  console.log(`  Total imported: ${totalImported}`);
  console.log(`  Total skipped:  ${totalSkipped}`);
  if (Object.keys(skippedReasons).length > 0) {
    console.log('\n  Skip reasons:');
    for (const [reason, count] of Object.entries(skippedReasons)) {
      console.log(`    ${reason}: ${count}`);
    }
  }
  if (dryRun) {
    console.log('\n  ** DRY RUN — no changes were made to the database **');
  }
  console.log('===========================================\n');

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
