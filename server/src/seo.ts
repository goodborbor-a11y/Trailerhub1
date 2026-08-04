import fs from 'fs';

export const SITE_URL = 'https://trailershub.org';

export type MovieRecord = {
  id: string | number;
  title: string;
  year?: number;
  category?: string;
  description?: string;
  overview?: string;
  poster_url?: string;
  trailer_url?: string;
  is_featured?: boolean;
  is_latest?: boolean;
  is_trending?: boolean;
  updated_at?: string;
  created_at?: string;
};

type PageSeo = {
  title: string;
  description: string;
  heading: string;
  noindex?: boolean;
  canonicalPath?: string;
};

const PUBLIC_PAGES: Record<string, PageSeo> = {
  '/': {
    title: 'TrailersHub: Latest Movie Trailers Worldwide',
    description: 'Discover and watch the latest movie trailers from Hollywood, Nollywood, Bollywood, K-Dramas, animation and global cinema in HD.',
    heading: 'Latest Movie Trailers Worldwide',
  },
  '/movies': {
    title: 'All Movie Trailers | TrailersHub',
    description: 'Browse movie and television trailers from Hollywood, Nollywood, Bollywood, Korean cinema, animation and more.',
    heading: 'All Movie Trailers',
  },
  '/trending': {
    title: 'Trending Movie Trailers Now | TrailersHub',
    description: 'Watch the most popular and trending movie and television trailers right now on TrailersHub.',
    heading: 'Trending Movie Trailers',
  },
  '/upcoming': {
    title: 'Upcoming Movie Trailers and Release Dates | TrailersHub',
    description: 'Discover anticipated upcoming movies, trailers and release dates from around the world.',
    heading: 'Upcoming Movie Trailers',
  },
  '/categories': {
    title: 'Movie Trailer Categories | TrailersHub',
    description: 'Browse movie trailers by cinema region, genre and television category.',
    heading: 'Browse Trailer Categories',
  },
  '/privacy': {
    title: 'Privacy Policy | TrailersHub',
    description: 'Learn how TrailersHub collects, uses and protects personal information.',
    heading: 'TrailersHub Privacy Policy',
  },
  '/dead-city': {
    title: 'Dead City: Apocalypse — Official Game Guide',
    description: 'Explore Dead City: Apocalypse, learn the basics, master advanced zombie-survival tactics, manage heroes and graphics settings, and access official support and legal information.',
    heading: 'Dead City: Apocalypse',
    canonicalPath: '/dead-city/',
  },
  '/dead-city/': {
    title: 'Dead City: Apocalypse — Official Game Guide',
    description: 'Explore Dead City: Apocalypse, learn the basics, master advanced zombie-survival tactics, manage heroes and graphics settings, and access official support and legal information.',
    heading: 'Dead City: Apocalypse',
    canonicalPath: '/dead-city/',
  },
  '/dead-city/privacy-policy': {
    title: 'Privacy Policy | Dead City: Apocalypse',
    description: 'Privacy policy for the Android game Dead City: Apocalypse.',
    heading: 'Dead City: Apocalypse Privacy Policy',
  },
  '/dead-city/terms-and-conditions': {
    title: 'Terms and Conditions | Dead City: Apocalypse',
    description: 'Terms and conditions for the Android game Dead City: Apocalypse.',
    heading: 'Dead City: Apocalypse Terms and Conditions',
  },
};

const PRIVATE_PREFIXES = ['/admin', '/auth', '/watchlist', '/favorites', '/my-reviews'];

// Keep this in sync with src/lib/slug.ts on the frontend. The two builds cannot
// share a module, so the rules are duplicated deliberately.
export const slugify = (value: string): string => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/['’`]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/** Slug a movie would like to own, before collisions are taken into account. */
export const baseMovieSlug = (movie: Pick<MovieRecord, 'id' | 'title' | 'year'>): string => {
  const base = slugify(movie.title);
  if (!base) return slugify(String(movie.id));
  return movie.year ? `${base}-${movie.year}` : base;
};

/**
 * Canonical slug per movie id. When two movies want the same slug, *both* get an
 * id suffix rather than one silently winning, so a canonical URL never points at
 * a different film than the one it was generated for.
 */
export const buildSlugIndex = (movies: MovieRecord[]): Map<string, string> => {
  const counts = new Map<string, number>();
  for (const movie of movies) {
    const base = baseMovieSlug(movie);
    counts.set(base, (counts.get(base) || 0) + 1);
  }
  const slugs = new Map<string, string>();
  for (const movie of movies) {
    const base = baseMovieSlug(movie);
    slugs.set(String(movie.id), (counts.get(base) || 0) > 1 ? `${base}-${slugify(String(movie.id))}` : base);
  }
  return slugs;
};

export const movieSlug = (movie: MovieRecord, movies: MovieRecord[]): string =>
  buildSlugIndex(movies).get(String(movie.id)) || baseMovieSlug(movie);

export const watchPath = (slug: string): string => `/watch/${encodeURIComponent(slug)}`;

const matchesId = (movie: MovieRecord, value: string): boolean =>
  String(movie.id) === value || `db-${movie.id}` === value || String(movie.id) === value.replace(/^db-/, '');

/**
 * Resolve a `/watch/<segment>` value. Old numeric ids keep working forever so
 * existing links and rankings survive; slugs are matched afterwards.
 */
export const findMovieBySegment = (segment: string, movies: MovieRecord[]): MovieRecord | undefined => {
  if (!segment) return undefined;
  const byId = movies.find(movie => matchesId(movie, segment));
  if (byId) return byId;

  const wanted = slugify(segment);
  const slugs = buildSlugIndex(movies);
  return movies.find(movie => slugs.get(String(movie.id)) === wanted)
    || movies.find(movie => baseMovieSlug(movie) === wanted);
};

/** Canonical `/watch/...` path for whatever `/watch/<segment>` was requested. */
export const canonicalWatchPath = (segment: string, movies: MovieRecord[]): string | null => {
  const movie = findMovieBySegment(segment, movies);
  if (!movie) return null;
  return watchPath(movieSlug(movie, movies));
};

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const safeJson = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

const isDeadCityPath = (pathname: string): boolean =>
  pathname === '/dead-city' || pathname === '/dead-city/' || pathname.startsWith('/dead-city/');

const DEAD_CITY_INITIAL_CSS = `<style id="dead-city-initial-css">
html{background:#03070a;color-scheme:dark}
body{margin:0;background:#03070a;color:#eef7f6}
#root{min-height:100vh;background:#03070a}
.dc-initial{box-sizing:border-box;min-height:100vh;overflow:hidden;background:radial-gradient(ellipse 55% 50% at 78% 42%,rgba(25,170,169,.17),transparent 70%),linear-gradient(115deg,#03070a 35%,#071117 70%,#020506);color:#eef7f6;font-family:Inter,Arial,sans-serif}
.dc-initial *{box-sizing:border-box}
.dc-initial__header{height:84px;display:flex;align-items:center;max-width:1240px;margin:auto;padding:0 28px;border-bottom:1px solid rgba(104,205,207,.17)}
.dc-initial__brand{display:flex;align-items:center;gap:12px;color:#eef7f6;text-decoration:none;text-transform:uppercase}
.dc-initial__mark{width:40px;height:40px;display:grid;place-items:center;border:1px solid rgba(100,228,224,.45);background:rgba(25,170,169,.1);color:#64e4e0;font-size:20px;transform:rotate(45deg)}
.dc-initial__mark span{transform:rotate(-45deg)}
.dc-initial__brand b,.dc-initial__brand small{display:block;line-height:1}
.dc-initial__brand b{font-size:20px;letter-spacing:.13em}
.dc-initial__brand small{margin-top:5px;color:#64e4e0;font-size:9px;letter-spacing:.28em}
.dc-initial__main{min-height:calc(100vh - 84px);display:grid;align-content:center;max-width:1240px;margin:auto;padding:64px 28px 96px}
.dc-initial__eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 16px;color:#64e4e0;font-size:11px;font-weight:800;letter-spacing:.22em;text-transform:uppercase}
.dc-initial__eyebrow:before{content:"";width:32px;height:2px;background:#ef5b47}
.dc-initial h1{max-width:800px;margin:0;color:#eef7f6;font:400 clamp(48px,8vw,102px)/.92 Impact,"Arial Narrow",sans-serif;letter-spacing:.025em;text-transform:uppercase;text-shadow:0 8px 40px #000}
.dc-initial--legal h1{font-size:clamp(42px,7vw,78px)}
.dc-initial__copy{max-width:720px;margin:24px 0 0;color:#a6b8ba;font-size:16px;line-height:1.7}
.dc-initial__status{width:min(100%,420px);height:52px;margin-top:32px;border:1px solid rgba(100,228,224,.28);border-left:3px solid #64e4e0;background:rgba(6,20,25,.75)}
.dc-initial__line{width:min(62%,260px);height:8px;margin:14px 16px 0;background:rgba(100,228,224,.18)}
.dc-initial__line+ .dc-initial__line{width:min(42%,180px);margin-top:8px;background:rgba(145,166,169,.12)}
.dc-initial__back{display:inline-flex;align-items:center;min-height:44px;margin-bottom:28px;color:#64e4e0;text-decoration:none}
@media(max-width:600px){.dc-initial__header{height:72px;padding:0 20px}.dc-initial__main{min-height:calc(100vh - 72px);padding:52px 20px 72px}.dc-initial h1{font-size:clamp(40px,13vw,56px)}.dc-initial--legal h1{font-size:clamp(34px,11vw,48px)}.dc-initial__copy{font-size:15px}}
</style>`;

const renderDeadCityInitialShell = (pathname: string, page: PageSeo): string => {
  const legalPage = pathname === '/dead-city/privacy-policy' || pathname === '/dead-city/terms-and-conditions';
  const label = pathname === '/dead-city/privacy-policy'
    ? 'Privacy Policy'
    : pathname === '/dead-city/terms-and-conditions'
      ? 'Terms and Conditions'
      : 'Official game guide';
  return `<div class="dc-initial${legalPage ? ' dc-initial--legal' : ''}" data-initial-shell="dead-city"><header class="dc-initial__header"><a class="dc-initial__brand" href="/dead-city/" aria-label="Dead City: Apocalypse home"><span class="dc-initial__mark" aria-hidden="true"><span>☠</span></span><span><b>Dead City</b><small>Apocalypse</small></span></a></header><main class="dc-initial__main">${legalPage ? '<a class="dc-initial__back" href="/dead-city/">← Back to Dead City</a>' : ''}<p class="dc-initial__eyebrow">${escapeHtml(label)}</p><h1>${escapeHtml(page.heading)}</h1><p class="dc-initial__copy">${escapeHtml(page.description)}</p><div class="dc-initial__status" aria-label="Loading Dead City content"><div class="dc-initial__line"></div><div class="dc-initial__line"></div></div></main></div>`;
};

export const readMovies = (moviesFile: string): MovieRecord[] => {
  try {
    const parsed = JSON.parse(fs.readFileSync(moviesFile, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const isKnownSpaPath = (pathname: string, movies: MovieRecord[]): boolean => {
  if (PUBLIC_PAGES[pathname]) return true;
  if (PRIVATE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true;
  if (pathname.startsWith('/watch/')) {
    const segment = decodeURIComponent(pathname.slice('/watch/'.length));
    // Static ids (`latest-3`, `tv-1`) live only in the frontend bundle, so they
    // are accepted without a catalogue match.
    const staticMovieId = /^(?:latest|trending|tv|[a-z])-\d+$/.test(segment);
    return staticMovieId || Boolean(findMovieBySegment(segment, movies));
  }
  return false;
};

const selectMovies = (pathname: string, movies: MovieRecord[]): MovieRecord[] => {
  if (pathname === '/trending') return movies.filter(movie => movie.is_trending).slice(0, 24);
  if (pathname === '/') return movies.filter(movie => movie.is_featured || movie.is_latest || movie.is_trending).slice(0, 24);
  return movies.slice(0, 40);
};

const movieDescription = (movie: MovieRecord): string => {
  const supplied = movie.description || movie.overview;
  if (supplied) return supplied.slice(0, 300);
  const year = movie.year ? ` (${movie.year})` : '';
  const category = movie.category ? ` ${movie.category}` : '';
  return `Watch the official trailer for ${movie.title}${year} and discover more${category} movie trailers on TrailersHub.`;
};

export const renderSeoHtml = (template: string, pathname: string, movies: MovieRecord[], nonce = ''): string => {
  const privatePage = PRIVATE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const deadCityPage = isDeadCityPath(pathname);
  let page = PUBLIC_PAGES[pathname];
  let movie: MovieRecord | undefined;
  // A legacy `/watch/<id>` request must still declare the slug URL as canonical.
  let canonicalOverride: string | null = null;

  if (pathname.startsWith('/watch/')) {
    const segment = decodeURIComponent(pathname.slice('/watch/'.length));
    movie = findMovieBySegment(segment, movies);
    if (movie) {
      canonicalOverride = watchPath(movieSlug(movie, movies));
      page = {
        title: `${movie.title}${movie.year ? ` (${movie.year})` : ''} Official Trailer | TrailersHub`,
        description: movieDescription(movie),
        heading: `${movie.title} Official Trailer`,
      };
    }
  }

  if (!page) {
    page = privatePage
      ? { title: 'Account | TrailersHub', description: 'TrailersHub account page.', heading: 'TrailersHub Account', noindex: true }
      : { title: 'Page Not Found | TrailersHub', description: 'The requested page could not be found.', heading: 'Page Not Found', noindex: true };
  }

  const canonical = `${SITE_URL}${canonicalOverride || page.canonicalPath || (pathname === '/' ? '/' : pathname)}`;
  const robots = page.noindex || privatePage ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const image = movie?.poster_url ? (movie.poster_url.startsWith('http') ? movie.poster_url : `${SITE_URL}${movie.poster_url}`) : `${SITE_URL}/favicon.jpg`;
  const schema = movie ? {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    dateCreated: movie.year ? String(movie.year) : undefined,
    image,
    description: movieDescription(movie),
    trailer: movie.trailer_url ? {
      '@type': 'VideoObject',
      name: `${movie.title} official trailer`,
      description: movieDescription(movie),
      thumbnailUrl: image,
      embedUrl: movie.trailer_url,
    } : undefined,
  } : {
    '@context': 'https://schema.org',
    '@type': pathname === '/' ? 'WebSite' : 'CollectionPage',
    name: page.heading,
    url: canonical,
    description: page.description,
  };

  const visibleMovies = deadCityPage ? [] : movie ? [movie] : selectMovies(pathname, movies);
  const slugs = visibleMovies.length ? buildSlugIndex(movies) : null;
  const links = visibleMovies.map(item => {
    const url = watchPath(slugs?.get(String(item.id)) || baseMovieSlug(item));
    const details = [item.year, item.category].filter(Boolean).join(' · ');
    return `<li><a href="${url}">${escapeHtml(item.title)}</a>${details ? ` <span>${escapeHtml(details)}</span>` : ''}</li>`;
  }).join('');
  const fallback = deadCityPage
    ? renderDeadCityInitialShell(pathname, page)
    : `<main id="crawler-content"><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p>${links ? `<nav aria-label="Movie trailers"><ul>${links}</ul></nav>` : ''}</main>`;

  return template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?>/i, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta\s+name="keywords"[\s\S]*?>/i, deadCityPage
      ? '<meta name="keywords" content="Dead City Apocalypse, zombie survival game, game guide, RockTimeMedia" />'
      : '$&')
    .replace(/<meta\s+(?:property="og:[^"]+"|name="twitter:[^"]+")[\s\S]*?>\s*/gi, '')
    .replace('</head>', [
      `<meta name="robots" content="${robots}" />`,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
      `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
      `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
      deadCityPage ? '' : `<meta property="og:image" content="${escapeHtml(image)}" />`,
      `<meta property="og:type" content="${movie ? 'video.movie' : 'website'}" />`,
      `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
      deadCityPage ? '' : `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
      `<script type="application/ld+json"${nonce ? ` nonce="${escapeHtml(nonce)}"` : ''}>${safeJson(schema)}</script>`,
      deadCityPage ? DEAD_CITY_INITIAL_CSS : '',
      '</head>',
    ].join('\n'))
    .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
};

export const renderSitemap = (movies: MovieRecord[]): string => {
  const today = new Date().toISOString().slice(0, 10);
  const staticUrls = ['/', '/movies', '/trending', '/upcoming', '/categories', '/privacy', '/dead-city/', '/dead-city/privacy-policy', '/dead-city/terms-and-conditions'];
  const entries = staticUrls.map(pathname => ({
    loc: `${SITE_URL}${pathname === '/' ? '/' : pathname}`,
    lastmod: today,
    priority: pathname === '/' ? '1.0' : '0.8',
  }));
  const slugs = buildSlugIndex(movies);
  for (const movie of movies) {
    const date = movie.updated_at || movie.created_at || today;
    entries.push({
      loc: `${SITE_URL}${watchPath(slugs.get(String(movie.id)) || baseMovieSlug(movie))}`,
      lastmod: /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : today,
      priority: '0.7',
    });
  }
  const urls = entries.map(entry => `  <url>\n    <loc>${escapeHtml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <priority>${entry.priority}</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};
