
CREATE TABLE public.movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  description TEXT,
  year INTEGER,
  genre TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT,
  backdrop_url TEXT,
  trailer_youtube_id TEXT,
  rating NUMERIC(3,1),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.movies TO anon, authenticated;
GRANT ALL ON public.movies TO service_role;

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view movies"
  ON public.movies FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add movies"
  ON public.movies FOR INSERT
  WITH CHECK (true);

CREATE INDEX movies_title_idx ON public.movies USING gin (to_tsvector('simple', title));
CREATE INDEX movies_year_idx ON public.movies (year);

-- Seed with a few Uzbek/world favorites
INSERT INTO public.movies (title, original_title, description, year, genre, poster_url, backdrop_url, trailer_youtube_id, rating, duration_minutes) VALUES
('Inception', 'Inception', 'Tush ichida tushga kirib ma''lumot o''g''irlaydigan o''g''ri jamoasi haqida ilmiy-fantastik triller.', 2010, ARRAY['Ilmiy-fantastika','Triller','Ekshn'], 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg', 'YoHD9XEInc0', 8.4, 148),
('Interstellar', 'Interstellar', 'Insoniyat kelajagini saqlab qolish uchun kosmosga sayohat qilayotgan astronavtlar hikoyasi.', 2014, ARRAY['Ilmiy-fantastika','Drama','Sarguzasht'], 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 'https://image.tmdb.org/t/p/original/pbrkL804c8yAv3zBZR4QPEafpB.jpg', 'zSWdZVtXT7E', 8.7, 169),
('The Dark Knight', 'The Dark Knight', 'Betmen Gotham shahrini xaotik Jokerdan himoya qiladi.', 2008, ARRAY['Ekshn','Krim','Drama'], 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg', 'EXeTwQWrcwY', 9.0, 152),
('Parasite', '기생충', 'Kambag''al oila boy oilaga xizmatchi bo''lib kiradi — natija kutilmagan.', 2019, ARRAY['Triller','Drama','Komediya'], 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', '5xH0HfJHsaY', 8.5, 132),
('Oppenheimer', 'Oppenheimer', 'Atom bombasini yaratgan olim J. Robert Oppenheimer haqida biografik drama.', 2023, ARRAY['Drama','Tarixiy','Biografiya'], 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 'https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg', 'uYPbbksJxIg', 8.3, 180),
('Spirited Away', '千と千尋の神隠し', 'Yosh qiz sehrli olamda o''z ota-onasini qutqarish uchun kurashadi.', 2001, ARRAY['Animatsiya','Fantasy','Oila'], 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', 'https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg', 'ByXuk9QqQkk', 8.6, 125),
('The Matrix', 'The Matrix', 'Xaker haqiqat aslida kompyuter simulyatsiyasi ekanini bilib oladi.', 1999, ARRAY['Ilmiy-fantastika','Ekshn'], 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'https://image.tmdb.org/t/p/original/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg', 'vKQi3bBA1y8', 8.7, 136),
('Dune: Part Two', 'Dune: Part Two', 'Pol Atreides Freman qabilasi bilan birlashib, oilasini xoin uylardan qasos oladi.', 2024, ARRAY['Ilmiy-fantastika','Sarguzasht','Drama'], 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg', 'Way9Dexny3w', 8.5, 166),
('Everything Everywhere All at Once', 'Everything Everywhere All at Once', 'Kir yuvish xonasi egasi ayolga koinotni saqlab qolish topshiriladi.', 2022, ARRAY['Ekshn','Sarguzasht','Komediya','Ilmiy-fantastika'], 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', 'https://image.tmdb.org/t/p/original/nGxUxi3PfXDRm7Vg95VBNgNM8yc.jpg', 'wxN1T1uxQ2g', 8.0, 139),
('Spider-Man: Into the Spider-Verse', 'Spider-Man: Into the Spider-Verse', 'Miles Morales boshqa olamlar Spider-menlar bilan uchrashadi.', 2018, ARRAY['Animatsiya','Ekshn','Sarguzasht'], 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', 'https://image.tmdb.org/t/p/original/7d6EY00g1c39SGZOoCJ5Py9nNth.jpg', 'g4Hbz2jLxvQ', 8.4, 117),
('La La Land', 'La La Land', 'Los-Anjelesda ikki orzumand — jazz pianinochisi va aktrisa — sevib qoladi.', 2016, ARRAY['Romantika','Musiqiy','Drama'], 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', 'https://image.tmdb.org/t/p/original/nlyu13XdCcbpwvXOL3Bwr5N4WvT.jpg', '0pdqf4P9MB8', 8.0, 128),
('Joker', 'Joker', 'Gotham shahridagi kulgili artist Artur Fleckning aqldan ozishi.', 2019, ARRAY['Drama','Triller','Krim'], 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', 'https://image.tmdb.org/t/p/original/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg', 'zAGVQLHvwOY', 8.4, 122);
