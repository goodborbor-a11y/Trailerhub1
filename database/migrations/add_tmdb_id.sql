-- Add tmdb_id column for deduplication in TMDB auto-import
-- Safe to run multiple times (IF NOT EXISTS pattern)

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
