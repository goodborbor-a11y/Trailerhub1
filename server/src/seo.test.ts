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

const sitemap = renderSitemap(movies);
assert(sitemap.includes('<loc>https://trailershub.org/watch/1</loc>'));
assert(!sitemap.includes('/auth'));

console.log(`SEO checks passed for ${movies.length} movie pages.`);
