
import { deduplicateMovies } from "./src/lib/utils/movies";
import { latestTrailers, trendingTrailers } from "./src/data/movies";

console.log("Testing deduplicateMovies...");

const latest = deduplicateMovies(latestTrailers.movies);
console.log(`Latest count: ${latest.length}`);
latest.forEach(m => console.log(`- ${m.title} (${m.id})`));

const trending = deduplicateMovies(trendingTrailers.movies);
console.log(`Trending count: ${trending.length}`);
trending.forEach(m => console.log(`- ${m.title} (${m.id})`));

// Mock DB movies
const dbMovies = [
    { id: "db-new-1", title: "The Last of Us", year: 2025, poster: "", trailerUrl: "", genres: [] }
];

const mergedLatest = deduplicateMovies([...dbMovies, ...latestTrailers.movies]);
console.log(`Merged Latest count: ${mergedLatest.length}`);
mergedLatest.forEach(m => console.log(`- ${m.title} (${m.id})`));
