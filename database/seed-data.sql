-- ===========================================
-- Seed Data for Movie Trailers App
-- ===========================================
-- Run with: psql -U movieapp -d movietrailers -f seed-data.sql
-- ===========================================

-- Insert default categories
INSERT INTO movie_categories (name, slug, description) VALUES
    ('Hollywood', 'hollywood', 'American blockbusters and Hollywood productions'),
    ('Bollywood', 'bollywood', 'Indian Hindi-language cinema'),
    ('Nollywood', 'nollywood', 'Nigerian film industry productions'),
    ('Korean', 'korean', 'South Korean cinema and K-dramas'),
    ('Anime', 'anime', 'Japanese animated films and series'),
    ('TV Series', 'tv-series', 'Television series and streaming shows')
ON CONFLICT (slug) DO NOTHING;

-- Insert default badges
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, points) VALUES
    ('First Review', 'Write your first movie review', 'pen', 'reviews', 'reviews', 1, 10),
    ('Critic', 'Write 10 movie reviews', 'edit', 'reviews', 'reviews', 10, 50),
    ('Top Reviewer', 'Write 50 movie reviews', 'award', 'reviews', 'reviews', 50, 200),
    ('Movie Buff', 'Add 10 movies to your watchlist', 'list', 'watchlist', 'watchlist', 10, 25),
    ('Cinephile', 'Add 50 movies to your watchlist', 'film', 'watchlist', 'watchlist', 50, 100),
    ('Collector', 'Add 10 movies to favorites', 'heart', 'favorites', 'favorites', 10, 30),
    ('Super Fan', 'Add 50 movies to favorites', 'star', 'favorites', 'favorites', 50, 150),
    ('Daily Visitor', 'Visit the site 7 days in a row', 'calendar', 'streak', 'streak', 7, 40),
    ('Dedicated', 'Visit the site 30 days in a row', 'flame', 'streak', 'streak', 30, 200)
ON CONFLICT DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('site_name', 'Movie Trailers', 'text', 'The name of the website'),
    ('site_description', 'Watch the latest movie trailers from Hollywood, Bollywood, and more', 'text', 'Site meta description'),
    ('contact_email', 'contact@example.com', 'text', 'Contact email address'),
    ('movies_per_page', '12', 'number', 'Number of movies to show per page'),
    ('enable_comments', 'true', 'boolean', 'Allow users to comment on movies'),
    ('enable_ratings', 'true', 'boolean', 'Allow users to rate movies'),
    ('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode')
ON CONFLICT (setting_key) DO NOTHING;

-- Sample movies (you can add more or import from your existing database)
INSERT INTO movies (title, year, category, trailer_url, poster_url, is_featured, is_trending, is_latest) VALUES
    ('Dune: Part Two', 2024, 'hollywood', 'https://www.youtube.com/watch?v=Way9Dexny3w', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg', true, true, true),
    ('Oppenheimer', 2023, 'hollywood', 'https://www.youtube.com/watch?v=uYPbbksJxIg', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', true, true, false),
    ('The Batman', 2022, 'hollywood', 'https://www.youtube.com/watch?v=mqqft2x_Aa4', 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvber9LAO2JQ2ipT.jpg', false, true, false),
    ('Parasite', 2019, 'korean', 'https://www.youtube.com/watch?v=5xH0HfJHsaY', 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', true, false, false),
    ('Squid Game', 2021, 'korean', 'https://www.youtube.com/watch?v=oqxAJKy0ii4', 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg', false, true, false),
    ('RRR', 2022, 'bollywood', 'https://www.youtube.com/watch?v=f_vbAtFSEc0', 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeF1lgXO.jpg', true, true, false),
    ('Jawan', 2023, 'bollywood', 'https://www.youtube.com/watch?v=MWOlnXpcu4A', 'https://image.tmdb.org/t/p/w500/jMBpJFRtrtIXymer93XLavPwI3P.jpg', false, true, false),
    ('Spirited Away', 2001, 'anime', 'https://www.youtube.com/watch?v=ByXuk9QqQkk', 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', true, false, false),
    ('Your Name', 2016, 'anime', 'https://www.youtube.com/watch?v=xU47nhruN-Q', 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg', false, true, false),
    ('The Last of Us', 2023, 'tv-series', 'https://www.youtube.com/watch?v=uLtkt8BonwM', 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', true, true, false),
    ('Severance', 2022, 'tv-series', 'https://www.youtube.com/watch?v=xEQP4VVuyrY', 'https://image.tmdb.org/t/p/w500/lFxfvrKkwBvPvokpmOBdEIVPSgf.jpg', false, true, false)
ON CONFLICT DO NOTHING;

-- Sample upcoming trailers
INSERT INTO upcoming_trailers (title, category, description, release_date, is_released) VALUES
    ('Avatar 3', 'hollywood', 'The third installment in the Avatar franchise', '2025-12-19 00:00:00+00', false),
    ('Mission Impossible 8', 'hollywood', 'The next chapter in the MI franchise', '2025-05-23 00:00:00+00', false),
    ('Pushpa 3', 'bollywood', 'Continuation of the Pushpa saga', '2025-08-15 00:00:00+00', false)
ON CONFLICT DO NOTHING;

COMMIT;
