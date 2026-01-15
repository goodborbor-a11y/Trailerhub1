-- ===========================================
-- Update Counts Script
-- ===========================================

-- 0. Ensure Schema & Constraints
-- Fix missing 'role' column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Add unique indexes for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON movie_categories(slug);

-- 1. Insert 3 Users (from users.json) with VALID UUIDs
INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BOSSMANUEL1964@GMAIL.COM', '$2a$10$WQjc4mXRx5/fD/sq43mkcezq.KoatRJasMVaA3i6LMVjar8TQ.NlG', 'admin', '2025-12-27T00:00:00Z', NOW()),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'drock4christ1@gmail.com', '$2a$10$WQjc4mXRx5/fD/sq43mkcezq.KoatRJasMVaA3i6LMVjar8TQ.NlG', 'user', '2025-12-29T10:00:00Z', NOW()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'goodborbor@gmail.com', '$2a$10$WQjc4mXRx5/fD/sq43mkcezq.KoatRJasMVaA3i6LMVjar8TQ.NlG', 'user', '2025-12-29T11:30:00Z', NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, display_name, avatar_url) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bayode Goodluck', NULL),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Apata Bayode', NULL),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Goodluck Ajayi', NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert 2 Extra Categories (to make total 8)
INSERT INTO movie_categories (name, slug, description) VALUES
    ('Chinese', 'chinese', 'Chinese cinema and blockbusters'),
    ('European', 'european', 'European cinema and award winners')
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Missing Movies (from movies.json)
INSERT INTO movies (title, year, category, trailer_url, poster_url, is_featured, is_trending, is_latest) VALUES
    ('Inception', 2010, 'hollywood', 'https://www.youtube.com/watch?v=YoHD9XEInc0', 'https://image.tmdb.org/t/p/original/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg', true, true, false),
    ('The Dark Knight', 2008, 'hollywood', 'https://www.youtube.com/watch?v=EXeTwQWrcwY', 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg', false, true, false),
    ('Interstellar', 2014, 'hollywood', 'https://www.youtube.com/watch?v=zSWdZVtXT7E', 'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', false, true, true),
    ('Severance', 2025, 'hollywood', 'https://www.youtube.com/watch?v=xEQP4VVuyrY', 'https://image.tmdb.org/t/p/original/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg', false, false, true),
    ('The Last of Us', 2025, 'hollywood', 'https://www.youtube.com/watch?v=uLtkt8BonwM', 'https://image.tmdb.org/t/p/original/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', false, false, true),
    ('Squid Game S2', 2024, 'korean', 'https://www.youtube.com/watch?v=Ed1sGgHUo88', 'https://image.tmdb.org/t/p/original/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg', false, false, true),
    ('Shogun', 2024, 'hollywood', 'https://www.youtube.com/watch?v=HIs9x49DK7I', 'https://image.tmdb.org/t/p/original/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg', false, false, true),
    ('House of the Dragon', 2024, 'hollywood', 'https://www.youtube.com/watch?v=YN2H_sKcmGw', 'https://image.tmdb.org/t/p/original/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg', false, false, true),
    ('Fallout', 2024, 'hollywood', 'https://www.youtube.com/watch?v=ECI3eCAxRGw', 'https://image.tmdb.org/t/p/original/c15BtJxCXMrISLVmysdsnZUPQft.jpg', false, false, true),
    ('Stranger Things', 2016, 'tv-series', 'https://www.youtube.com/watch?v=b9EkMc79ZSU', NULL, false, false, false),
    ('Wednesday', 2022, 'tv-series', 'https://www.youtube.com/watch?v=Di310WS8zLk', NULL, false, false, false),
    ('The White Lotus', 2021, 'tv-series', 'https://www.youtube.com/watch?v=TGLq7_MonZ4', NULL, false, false, false),
    ('Yellowjackets', 2021, 'tv-series', 'https://www.youtube.com/watch?v=Axx9Qhct49w', NULL, false, false, false),
    ('Slow Horses', 2022, 'tv-series', 'https://www.youtube.com/watch?v=A9BCtrziWtg', NULL, false, false, false),
    ('The Gentlemen', 2024, 'tv-series', 'https://www.youtube.com/watch?v=wyEOwHrpZH4', NULL, false, false, false),
    ('Oppenheimer', 2023, 'hollywood', 'https://www.youtube.com/watch?v=bK6ldnjE3Y0', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', true, true, false),
    ('Dune: Part Two', 2024, 'hollywood', 'https://www.youtube.com/watch?v=Way9Dexny3w', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg', true, true, true),
    ('Avatar: The Way of Water', 2022, 'hollywood', 'https://www.youtube.com/watch?v=d9MyW72ELq0', NULL, false, false, false),
    ('The Batman', 2022, 'hollywood', 'https://www.youtube.com/watch?v=mqqft2x_Aa4', 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvber9LAO2JQ2ipT.jpg', false, true, false),
    ('Top Gun: Maverick', 2022, 'hollywood', 'https://www.youtube.com/watch?v=qSqVVswa420', NULL, false, false, false),
    ('Black Panther: Wakanda Forever', 2022, 'hollywood', 'https://www.youtube.com/watch?v=_Z3QKkl1WyM', NULL, false, false, false),
    ('Spider-Man: No Way Home', 2021, 'hollywood', 'https://www.youtube.com/watch?v=JfVOs4VSpmA', NULL, false, false, false),
    ('The Black Book', 2023, 'nollywood', 'https://www.youtube.com/watch?v=6PPH4SOm9gk', NULL, false, false, false),
    ('Anikulapo', 2022, 'nollywood', 'https://www.youtube.com/watch?v=CBnIpwSOWEg', NULL, false, false, false),
    ('King of Thieves', 2022, 'nollywood', 'https://www.youtube.com/watch?v=7VzWqdFfdGY', NULL, false, false, false),
    ('Gangs of Lagos', 2023, 'nollywood', 'https://www.youtube.com/watch?v=CciXkcGPij8', NULL, false, false, false),
    ('Brotherhood', 2022, 'nollywood', 'https://www.youtube.com/watch?v=cJaR6ScaKmM', NULL, false, false, false),
    ('Pathaan', 2023, 'bollywood', 'https://www.youtube.com/watch?v=vqu4z34wENw', NULL, false, false, false),
    ('Jawan', 2023, 'bollywood', 'https://www.youtube.com/watch?v=COv52Qyctws', 'https://image.tmdb.org/t/p/w500/jMBpJFRtrtIXymer93XLavPwI3P.jpg', false, true, false),
    ('Parasite', 2019, 'korean', 'https://www.youtube.com/watch?v=5xH0HfJHsaY', 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', true, false, false),
    ('Squid Game', 2021, 'korean', 'https://www.youtube.com/watch?v=oqxAJKy0ii4', 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg', false, true, false),
    ('RRR', 2022, 'bollywood', 'https://www.youtube.com/watch?v=f_vbAtFSEc0', 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeF1lgXO.jpg', true, true, false),
    ('Spirited Away', 2001, 'anime', 'https://www.youtube.com/watch?v=ByXuk9QqQkk', 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', true, false, false),
    ('Your Name', 2016, 'anime', 'https://www.youtube.com/watch?v=xU47nhruN-Q', 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg', false, true, false),
    ('Suzume', 2022, 'anime', 'https://www.youtube.com/watch?v=5pTcio2hTSw', NULL, false, false, false),
    ('Jujutsu Kaisen 0', 2021, 'anime', 'https://www.youtube.com/watch?v=4A_X-Dvl0ws', NULL, false, false, false),
    ('The Wandering Earth 2', 2023, 'chinese', 'https://www.youtube.com/watch?v=8ZIfInUTiIg', NULL, false, false, false),
    ('Detective Chinatown 3', 2021, 'chinese', 'https://www.youtube.com/watch?v=Q3yHJuRkfUI', NULL, false, false, false),
    ('The Zone of Interest', 2023, 'european', 'https://www.youtube.com/watch?v=r-vfg3KkV54', NULL, false, false, false),
    ('Anatomy of a Fall', 2023, 'european', 'https://www.youtube.com/watch?v=fTrsp5BMloA', NULL, false, false, false),
    ('Se7en', 1995, 'hollywood', 'https://www.youtube.com/watch?v=znmZoVkCjpI', NULL, false, false, false),
    ('Gone Girl', 2014, 'hollywood', 'https://www.youtube.com/watch?v=2-_-1nJf8Vg', NULL, false, false, false),
    ('Prisoners', 2013, 'hollywood', 'https://www.youtube.com/watch?v=bpXfcTF6iVk', NULL, false, false, false),
    ('Shutter Island', 2010, 'hollywood', 'https://www.youtube.com/watch?v=5iaYLCiq5RM', NULL, false, false, false),
    ('The Silence of the Lambs', 1991, 'hollywood', 'https://www.youtube.com/watch?v=6iB21hsprAQ', NULL, false, false, false),
    ('Zodiac', 2007, 'hollywood', 'https://www.youtube.com/watch?v=yNncHPl1UXg', NULL, false, false, false)
ON CONFLICT (title) DO NOTHING;
