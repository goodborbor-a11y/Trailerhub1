import { Movie } from "@/data/movies";

/**
 * Deduplicates a list of movies based on title and year.
 * When a duplicate is found, it prefers the one with a 'db-' prefix (database entry).
 */
export const deduplicateMovies = (movies: Movie[]): Movie[] => {
    const seen = new Map<string, Movie>();

    movies.forEach(movie => {
        const key = `${movie.title.toLowerCase().trim()}-${movie.year}`;
        const existing = seen.get(key);

        if (!existing) {
            seen.set(key, movie);
        } else {
            // If we have a duplicate, prefer the one with a database ID (db- prefix)
            // or the one that already has a valid-looking poster URL (not a static placeholder)
            const isNewDb = movie.id.startsWith('db-');
            const isExistingDb = existing.id.startsWith('db-');

            if (isNewDb && !isExistingDb) {
                seen.set(key, movie);
            }
            // If both are DB or both are static, keep the one that was already there
        }
    });

    return Array.from(seen.values());
};
