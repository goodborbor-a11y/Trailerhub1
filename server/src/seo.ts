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

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const safeJson = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

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
    const id = decodeURIComponent(pathname.slice('/watch/'.length));
    const staticMovieId = /^(?:latest|trending|tv|[a-z])-\d+$/.test(id);
    return staticMovieId || movies.some(movie => String(movie.id) === id || `db-${movie.id}` === id);
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

export const renderSeoHtml = (template: string, pathname: string, movies: MovieRecord[]): string => {
  const privatePage = PRIVATE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
  let page = PUBLIC_PAGES[pathname];
  let movie: MovieRecord | undefined;

  if (pathname.startsWith('/watch/')) {
    const id = decodeURIComponent(pathname.slice('/watch/'.length));
    movie = movies.find(item => String(item.id) === id || `db-${item.id}` === id);
    if (movie) {
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

  const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
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

  const visibleMovies = movie ? [movie] : selectMovies(pathname, movies);
  const links = visibleMovies.map(item => {
    const url = `/watch/${encodeURIComponent(String(item.id))}`;
    const details = [item.year, item.category].filter(Boolean).join(' · ');
    return `<li><a href="${url}">${escapeHtml(item.title)}</a>${details ? ` <span>${escapeHtml(details)}</span>` : ''}</li>`;
  }).join('');
  const fallback = `<main id="crawler-content"><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p>${links ? `<nav aria-label="Movie trailers"><ul>${links}</ul></nav>` : ''}</main>`;

  return template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?>/i, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta\s+(?:property="og:[^"]+"|name="twitter:[^"]+")[\s\S]*?>\s*/gi, '')
    .replace('</head>', [
      `<meta name="robots" content="${robots}" />`,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
      `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
      `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
      `<meta property="og:image" content="${escapeHtml(image)}" />`,
      `<meta property="og:type" content="${movie ? 'video.movie' : 'website'}" />`,
      `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
      `<script type="application/ld+json">${safeJson(schema)}</script>`,
      '</head>',
    ].join('\n'))
    .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
};

export const renderSitemap = (movies: MovieRecord[]): string => {
  const today = new Date().toISOString().slice(0, 10);
  const staticUrls = ['/', '/movies', '/trending', '/upcoming', '/categories', '/privacy'];
  const entries = staticUrls.map(pathname => ({
    loc: `${SITE_URL}${pathname === '/' ? '/' : pathname}`,
    lastmod: today,
    priority: pathname === '/' ? '1.0' : '0.8',
  }));
  for (const movie of movies) {
    const date = movie.updated_at || movie.created_at || today;
    entries.push({
      loc: `${SITE_URL}/watch/${encodeURIComponent(String(movie.id))}`,
      lastmod: /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : today,
      priority: '0.7',
    });
  }
  const urls = entries.map(entry => `  <url>\n    <loc>${escapeHtml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <priority>${entry.priority}</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};
