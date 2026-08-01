-- Fix broken image links
UPDATE public.movies SET poster_url='https://image.tmdb.org/t/p/w500/fgBNLPr6mC8pxuR79ENAJY4nBmj.jpg', backdrop_url='https://image.tmdb.org/t/p/original/1I1t1TYMsbUNHCxtBvqgwKsXeCl.jpg' WHERE title='Crash Landing on You';
UPDATE public.movies SET backdrop_url='https://image.tmdb.org/t/p/original/19BEncBUw4TKk1WAdrQYZacM5PK.jpg' WHERE title='Squid Game';
UPDATE public.movies SET poster_url='https://image.tmdb.org/t/p/w500/e1nWfnnCVqxS2LeTO3dwGyAsG2V.jpg', backdrop_url='https://image.tmdb.org/t/p/original/1futGOMblsmQF8Gujz2KUCWITgH.jpg' WHERE title='Planet Earth II';
UPDATE public.movies SET poster_url='https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg', backdrop_url='https://image.tmdb.org/t/p/original/1O41db0b9yYiXrsXGNt6nYYNXeE.jpg' WHERE title='Toy Story';
UPDATE public.movies SET backdrop_url='https://image.tmdb.org/t/p/original/17QOQENrIS5DvazwpqW6jrcWA1T.jpg' WHERE title='La La Land';
UPDATE public.movies SET backdrop_url='https://image.tmdb.org/t/p/original/10bguAO8UtYDPWwtLCjigeS1ns2.jpg' WHERE title='Attack on Titan';
UPDATE public.movies SET backdrop_url='https://image.tmdb.org/t/p/original/1GfWh0hquQCXaZL4f4O3skxu09Y.jpg' WHERE title='Interstellar';
UPDATE public.movies SET backdrop_url='https://image.tmdb.org/t/p/original/14lvW78eZ0o3uptiRMZYmXhqCGU.jpg' WHERE title='Breaking Bad';

-- Remove junk/test rows with invalid image links
DELETE FROM public.movies WHERE title IN ('Hyyyy', 'Assassin''s');

-- Remove duplicate Spirited Away entry (keep the oldest)
DELETE FROM public.movies m
 WHERE m.ctid NOT IN (SELECT min(x.ctid) FROM public.movies x WHERE x.title = m.title);