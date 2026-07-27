import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { isKnownSpaPath, readMovies, renderSeoHtml, renderSitemap } from './seo';

const indexPath = path.join(__dirname, '../../dist/index.html');
const moviesPath = path.join(__dirname, '../data/movies.json');
const template = fs.readFileSync(indexPath, 'utf8');
const movies = readMovies(moviesPath);

assert(movies.length > 0, 'expected movie fixtures');

const home = renderSeoHtml(template, '/', movies, 'test-nonce');
assert(home.includes('<h1>Latest Movie Trailers Worldwide</h1>'));
assert(home.includes('<link rel="canonical" href="https://trailershub.org/" />'));
assert(home.includes('<meta name="robots" content="index, follow'));
assert(home.includes('/watch/1'));
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
assert(sitemap.includes('<loc>https://trailershub.org/watch/1</loc>'));
assert(sitemap.includes('<loc>https://trailershub.org/dead-city/</loc>'));
assert(!sitemap.includes('/auth'));

console.log(`SEO checks passed for ${movies.length} movie pages.`);
