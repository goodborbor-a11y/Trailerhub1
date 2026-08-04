import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { baseMovieSlug, buildSlugIndex, canonicalWatchPath, findMovieBySegment, isKnownSpaPath, readMovies, renderSeoHtml, renderSitemap, slugify } from './seo';

const indexPath = path.join(__dirname, '../../dist/index.html');
const moviesPath = path.join(__dirname, '../data/movies.json');
const template = fs.readFileSync(indexPath, 'utf8');
const movies = readMovies(moviesPath);

assert(movies.length > 0, 'expected movie fixtures');

const home = renderSeoHtml(template, '/', movies, 'test-nonce');
assert(home.includes('<h1>Latest Movie Trailers Worldwide</h1>'));
assert(home.includes('<link rel="canonical" href="https://trailershub.org/" />'));
assert(home.includes('<meta name="robots" content="index, follow'));
assert(home.includes('/watch/inception-2010'));
assert(home.includes('<script type="application/ld+json" nonce="test-nonce">'));

const movie = renderSeoHtml(template, '/watch/1', movies);
assert(movie.includes('<title>Inception (2010) Official Trailer | TrailersHub</title>'));
assert(movie.includes('"@type":"Movie"'));
assert(movie.includes('<h1>Inception Official Trailer</h1>'));
assert(isKnownSpaPath('/watch/1', movies));

const account = renderSeoHtml(template, '/auth', movies);
assert(account.includes('<meta name="robots" content="noindex, nofollow" />'));
assert(!isKnownSpaPath('/not-a-real-route', movies));

const deadCityPaths = [
  '/dead-city',
  '/dead-city/',
  '/dead-city/privacy-policy',
  '/dead-city/terms-and-conditions',
];

for (const pathname of deadCityPaths) {
  const rendered = renderSeoHtml(template, pathname, movies);
  assert(isKnownSpaPath(pathname, movies), `expected known Dead City route: ${pathname}`);
  assert(rendered.includes('data-initial-shell="dead-city"'), `expected Dead City loading shell: ${pathname}`);
  assert(rendered.includes('id="dead-city-initial-css"'), `expected critical Dead City styles: ${pathname}`);
  assert(!rendered.includes('id="crawler-content"'), `unexpected movie fallback: ${pathname}`);
  for (const fixture of movies) {
    assert(!rendered.includes(`>${fixture.title}<`), `unexpected movie title on ${pathname}: ${fixture.title}`);
  }
}

const deadCityHome = renderSeoHtml(template, '/dead-city/', movies);
assert(deadCityHome.includes('<title>Dead City: Apocalypse — Official Game Guide</title>'));
assert(deadCityHome.includes('<link rel="canonical" href="https://trailershub.org/dead-city/" />'));
assert(!deadCityHome.includes('movie trailers, HD trailers'));

const deadCityPrivacy = renderSeoHtml(template, '/dead-city/privacy-policy', movies);
assert(deadCityPrivacy.includes('Dead City: Apocalypse Privacy Policy'));
assert(deadCityPrivacy.includes('← Back to Dead City'));

const sitemap = renderSitemap(movies);
assert(sitemap.includes('<loc>https://trailershub.org/watch/inception-2010</loc>'));
assert(!sitemap.includes('<loc>https://trailershub.org/watch/1</loc>'), 'sitemap must advertise slugs, not ids');
assert(sitemap.includes('<loc>https://trailershub.org/dead-city/</loc>'));
assert(!sitemap.includes('/auth'));

// --- slug URLs -------------------------------------------------------------

assert.strictEqual(slugify('Jagun Jagun: The Warrior'), 'jagun-jagun-the-warrior');
assert.strictEqual(slugify("Ne Zha & Amélie's Café"), 'ne-zha-and-amelies-cafe');
assert.strictEqual(baseMovieSlug({ id: '1', title: 'Inception', year: 2010 }), 'inception-2010');
assert.strictEqual(baseMovieSlug({ id: '9', title: 'Untitled' }), 'untitled');

// Two films sharing a title and year must not share a URL.
const clashing = [
  { id: '1', title: 'The Grudge', year: 2020 },
  { id: '2', title: 'The Grudge', year: 2020 },
  { id: '3', title: 'Solo', year: 2018 },
];
const clashingSlugs = buildSlugIndex(clashing);
assert.strictEqual(clashingSlugs.get('1'), 'the-grudge-2020-1');
assert.strictEqual(clashingSlugs.get('2'), 'the-grudge-2020-2');
assert.strictEqual(clashingSlugs.get('3'), 'solo-2018');
assert.strictEqual(findMovieBySegment('the-grudge-2020-2', clashing)?.id, '2');

// Legacy ids still resolve, and report the slug as their canonical home.
assert.strictEqual(findMovieBySegment('1', movies)?.title, 'Inception');
assert.strictEqual(findMovieBySegment('inception-2010', movies)?.title, 'Inception');
assert.strictEqual(findMovieBySegment('db-1', movies)?.title, 'Inception');
assert.strictEqual(canonicalWatchPath('1', movies), '/watch/inception-2010');
assert.strictEqual(canonicalWatchPath('inception-2010', movies), '/watch/inception-2010');
assert.strictEqual(canonicalWatchPath('no-such-film-1999', movies), null);

assert(isKnownSpaPath('/watch/inception-2010', movies));
assert(isKnownSpaPath('/watch/latest-3', movies), 'static bundle ids must stay routable');
assert(!isKnownSpaPath('/watch/definitely-not-a-film-1999', movies));

const slugPage = renderSeoHtml(template, '/watch/inception-2010', movies);
assert(slugPage.includes('<title>Inception (2010) Official Trailer | TrailersHub</title>'));
assert(slugPage.includes('<link rel="canonical" href="https://trailershub.org/watch/inception-2010" />'));

// A legacy id URL points search engines at the slug.
const legacyPage = renderSeoHtml(template, '/watch/1', movies);
assert(legacyPage.includes('<link rel="canonical" href="https://trailershub.org/watch/inception-2010" />'));

// Crawler links use slugs too.
assert(home.includes('href="/watch/inception-2010"'));

console.log(`SEO checks passed for ${movies.length} movie pages.`);
