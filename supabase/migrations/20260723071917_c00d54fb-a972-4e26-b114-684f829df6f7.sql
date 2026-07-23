
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'Film',
  ADD COLUMN IF NOT EXISTS full_youtube_id text;

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.comments TO anon, authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Anyone can add comments" ON public.comments FOR INSERT WITH CHECK (
  length(trim(nickname)) BETWEEN 1 AND 40 AND length(trim(body)) BETWEEN 1 AND 2000
);

CREATE INDEX IF NOT EXISTS comments_movie_id_created_at_idx ON public.comments(movie_id, created_at DESC);
CREATE INDEX IF NOT EXISTS movies_type_idx ON public.movies(type);

-- Seed variety
INSERT INTO public.movies (title, original_title, description, year, genre, type, poster_url, backdrop_url, trailer_youtube_id, full_youtube_id, rating, duration_minutes) VALUES
('Attack on Titan', 'Shingeki no Kyojin', 'Insoniyat devor ortida titanlardan yashirinadi. Eren o''z taqdiriga qarshi kurashadi.', 2013, ARRAY['Anime','Action','Drama'], 'Anime', 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg', 'https://image.tmdb.org/t/p/original/8OF0h9m7c9orL3wJxJZlDwZzZ8B.jpg', 'MGRm4IzK1SQ', 'MGRm4IzK1SQ', 9.0, 24),
('Your Name', 'Kimi no Na wa', 'Ikki notanish yosh sirli tarzda tanalarini almashtiradilar.', 2016, ARRAY['Anime','Romance'], 'Anime', 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg', 'https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg', 'xU47nhruN-Q', 'xU47nhruN-Q', 8.4, 106),
('Squid Game', 'Ojingeo Geim', 'Qarzga botgan odamlar katta pul uchun bolalar o''yinlarini o''ynaydilar.', 2021, ARRAY['K-Drama','Thriller'], 'K-Drama', 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg', 'https://image.tmdb.org/t/p/original/oy5cV5ANuT2ItQjX0AF9Erhc9Xt.jpg', 'oqxAJKy0ii4', 'oqxAJKy0ii4', 8.0, 55),
('Crash Landing on You', 'Sarangui Bulsichak', 'Janubiy koreys biznesvumen Shimoliy Koreyaga tushib qoladi.', 2019, ARRAY['K-Drama','Romance'], 'K-Drama', 'https://image.tmdb.org/t/p/w500/q7dgS5C7lqIkI0Q3vX0zqLzGh1E.jpg', 'https://image.tmdb.org/t/p/original/xJHokPmyEjr3zaqf7BeVW1U2FZH.jpg', 'F8OW0OtQ0mE', 'F8OW0OtQ0mE', 8.7, 70),
('Spirited Away', 'Sen to Chihiro no Kamikakushi', 'Qiz sirli ruhlar dunyosiga tushib qoladi va ota-onasini qutqarishga harakat qiladi.', 2001, ARRAY['Multfilm','Fantasy'], 'Multfilm', 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', 'https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg', 'ByXuk9QqQkk', 'ByXuk9QqQkk', 8.6, 125),
('Toy Story', 'Toy Story', 'O''yinchoqlarning yashirin hayoti haqidagi klassik multfilm.', 1995, ARRAY['Multfilm','Family'], 'Multfilm', 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKL6xg.jpg', 'https://image.tmdb.org/t/p/original/dji4Fm0gCDVb9DQQMRvAI8YNnTz.jpg', 'v-PjgYDrg70', 'v-PjgYDrg70', 8.3, 81),
('Breaking Bad', 'Breaking Bad', 'Kimyo o''qituvchisi rak tashxisi olgach, metamfetamin ishlab chiqara boshlaydi.', 2008, ARRAY['Serial','Crime','Drama'], 'Serial', 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu022Q9qgg7yQt1LB6.jpg', 'HhesaQXLuRY', 'HhesaQXLuRY', 9.5, 47),
('Planet Earth II', 'Planet Earth II', 'Sayyoramizning ajoyib manzaralari va yovvoyi tabiati.', 2016, ARRAY['Hujjatli','Nature'], 'Hujjatli', 'https://image.tmdb.org/t/p/w500/qNS7EFxvyGCJvhOaTKS8i2G9wgb.jpg', 'https://image.tmdb.org/t/p/original/pRfKfWzUmg7iuyM2VauLcNlLd3W.jpg', 'c8aFcHFu8QM', 'c8aFcHFu8QM', 9.4, 60);
