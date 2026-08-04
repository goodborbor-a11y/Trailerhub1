// Keep these rules in sync with server/src/seo.ts. The frontend and server builds
// cannot share a module, so the logic is duplicated deliberately.

export const slugify = (value: string): string => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/['’`]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

type Sluggable = {
  id: string | number;
  title?: string;
  year?: number;
  slug?: string;
};

/**
 * Slug for a movie the API has not annotated. The server sends `slug` on every
 * movie it returns; this is the fallback for the static catalogue in
 * src/data/movies.ts, which has no server round-trip.
 */
export const movieSlug = (movie: Sluggable): string => {
  if (movie.slug) return movie.slug;
  const base = slugify(movie.title || '');
  if (!base) return String(movie.id);
  return movie.year ? `${base}-${movie.year}` : base;
};

/** Canonical link to a trailer page. */
export const watchHref = (movie: Sluggable): string => `/watch/${encodeURIComponent(movieSlug(movie))}`;
